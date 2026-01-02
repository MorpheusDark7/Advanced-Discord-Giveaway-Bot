const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');
const ms = require('ms');
const db = require('../database/server');
const { COLORS, EMOJIS, BUTTON_IDS, BRAND } = require('../config/constants');
const giveawayManager = require('../utils/giveawayManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Advanced Giveaway Management')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('Start a new giveaway')
                .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g. 1m, 1h, 1d)').setRequired(true))
                .addStringOption(opt => opt.setName('prize').setDescription('What are you giving away?').setRequired(true))
                .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List all giveaways in this server')
        )
        .addSubcommand(sub =>
            sub.setName('end')
                .setDescription('End an active giveaway')
                .addStringOption(opt => opt.setName('query').setDescription('Giveaway ID or Message ID').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('reroll')
                .setDescription('Reroll an ended giveaway')
                .addStringOption(opt => opt.setName('query').setDescription('Giveaway ID or Message ID').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('info')
                .setDescription('Show information about a giveaway')
                .addStringOption(opt => opt.setName('query').setDescription('Giveaway ID or Message ID').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('edit')
                .setDescription('Edit an active giveaway')
                .addStringOption(opt => opt.setName('query').setDescription('Giveaway ID or Message ID').setRequired(true))
                .addStringOption(opt => opt.setName('duration').setDescription('New duration (e.g. 10m)'))
                .addStringOption(opt => opt.setName('prize').setDescription('New prize'))
                .addIntegerOption(opt => opt.setName('winners').setDescription('New winner count'))
        )
        .addSubcommand(sub =>
            sub.setName('delete')
                .setDescription('Delete a giveaway (removes message and data)')
                .addStringOption(opt => opt.setName('query').setDescription('Giveaway ID or Message ID').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('pause')
                .setDescription('Pause an active giveaway')
                .addStringOption(opt => opt.setName('query').setDescription('Giveaway ID or Message ID').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('resume')
                .setDescription('Resume a paused giveaway')
                .addStringOption(opt => opt.setName('query').setDescription('Giveaway ID or Message ID').setRequired(true))
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'start') {
            const durationStr = interaction.options.getString('duration');
            const prize = interaction.options.getString('prize');
            const winnerCount = interaction.options.getInteger('winners') || 1;

            const durationMs = ms(durationStr);
            if (!durationMs) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`**${EMOJIS.ERROR} Invalid duration format. (Use 1m, 1h, 1d)**`)],
                    flags: MessageFlags.Ephemeral
                });
            }

            if (durationMs > ms('30d')) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`**${EMOJIS.ERROR} Giveaway duration cannot exceed 30 days.**`)],
                    flags: MessageFlags.Ephemeral
                });
            }

            const endAt = Date.now() + durationMs;
            const giveawayId = Math.random().toString(36).substring(2, 9).toUpperCase();

            const settings = db.getGuildSettings(interaction.guildId);
            const boostedRoles = JSON.parse(settings.boosted_roles || '[]');
            const boostedRolesText = boostedRoles.length > 0 ? boostedRoles.map(id => `<@&${id}>`).join(' ') : 'None';

            const embed = new EmbedBuilder()
                .setTitle(`${BRAND.NAME} ${prize} Giveaway`)
                .setColor(COLORS.PRIMARY)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setDescription(`Ends: <t:${Math.floor(endAt / 1000)}:R> (<t:${Math.floor(endAt / 1000)}:f>)\nHosted by: ${interaction.user}\nEntries: 0\nWinners: ${winnerCount}\n\n**Boosted Roles (2x Luck)**\n${boostedRolesText}`)
                .setFooter({ text: BRAND.FOOTER });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`${BUTTON_IDS.ENTER_GIVEAWAY}_${giveawayId}`)
                    .setLabel('Join')
                    .setEmoji(EMOJIS.GIVEAWAY)
                    .setStyle(ButtonStyle.Primary)
            );

            const response = await interaction.reply({ embeds: [embed], components: [row], withResponse: true });
            const message = response.resource.message;

            db.createGiveaway({
                id: giveawayId,
                message_id: message.id,
                channel_id: interaction.channelId,
                guild_id: interaction.guildId,
                prize: prize,
                winner_count: winnerCount,
                end_at: endAt,
                hosted_by: interaction.user.id
            });

            console.log(`[COMMAND] Giveaway created: ${prize} (${giveawayId})`);
        }

        if (subcommand === 'list') {
            const giveaways = db.getGiveawaysByGuild(interaction.guildId);
            if (giveaways.length === 0) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`**${EMOJIS.ERROR} No giveaways found in this server.**`)],
                    flags: MessageFlags.Ephemeral
                });
            }

            const active = giveaways.filter(g => g.status === 'active' || g.status === 'paused');
            const ended = giveaways.filter(g => g.status === 'ended' || g.status === 'rerolled');

            const embed = new EmbedBuilder()
                .setTitle(`${BRAND.NAME} Giveaways`)
                .setColor(COLORS.PRIMARY)
                .addFields(
                    { name: `Active (${active.length})`, value: active.map(g => `\`${g.id}\` - **${g.prize}** (<t:${Math.floor(g.end_at / 1000)}:R>)`).join('\n') || 'None' },
                    { name: `Ended (${ended.length})`, value: ended.slice(0, 5).map(g => `\`${g.id}\` - **${g.prize}** (Ended)`).join('\n') || 'None' }
                );

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === 'end') {
            const query = interaction.options.getString('query');
            const giveaway = db.getGiveaway(query);

            if (!giveaway || (giveaway.status !== 'active' && giveaway.status !== 'paused')) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`**${EMOJIS.ERROR} Giveaway not found or already ended.**`)],
                    flags: MessageFlags.Ephemeral
                });
            }

            await giveawayManager.endGiveaway(giveaway.id);
            await interaction.reply({
                embeds: [new EmbedBuilder().setColor(COLORS.SUCCESS).setDescription(`**${EMOJIS.SUCCESS} Giveaway ended successfully.**`)],
                flags: MessageFlags.Ephemeral
            });
        }

        if (subcommand === 'reroll') {
            const query = interaction.options.getString('query');
            await giveawayManager.reroll(query, interaction);
        }

        if (subcommand === 'info') {
            const query = interaction.options.getString('query');
            const giveaway = db.getGiveaway(query);

            if (!giveaway) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`**${EMOJIS.ERROR} Giveaway not found.**`)],
                    flags: MessageFlags.Ephemeral
                });
            }

            const entries = db.getEntryCount(giveaway.id);
            const embed = new EmbedBuilder()
                .setTitle(`Giveaway Info: ${giveaway.prize}`)
                .setColor(COLORS.PRIMARY)
                .addFields(
                    { name: 'ID', value: `\`${giveaway.id}\``, inline: true },
                    { name: 'Status', value: `\`${giveaway.status.toUpperCase()}\``, inline: true },
                    { name: 'Winners', value: `${giveaway.winner_count}`, inline: true },
                    { name: 'Entries', value: `${entries}`, inline: true },
                    { name: 'Ends', value: `<t:${Math.floor(giveaway.end_at / 1000)}:f>`, inline: true },
                    { name: 'Channel', value: `<#${giveaway.channel_id}>`, inline: true }
                );

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === 'edit') {
            const query = interaction.options.getString('query');
            const durationStr = interaction.options.getString('duration');
            const prize = interaction.options.getString('prize');
            const winners = interaction.options.getInteger('winners');

            const giveaway = db.getGiveaway(query);
            if (!giveaway || (giveaway.status !== 'active' && giveaway.status !== 'paused')) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`**${EMOJIS.ERROR} Only active or paused giveaways can be edited.**`)],
                    flags: MessageFlags.Ephemeral
                });
            }

            const newData = {
                prize: prize || giveaway.prize,
                winner_count: winners || giveaway.winner_count,
                end_at: durationStr ? (Date.now() + ms(durationStr)) : giveaway.end_at
            };

            db.editGiveaway(giveaway.id, newData);

            const channel = await interaction.client.channels.fetch(giveaway.channel_id).catch(() => null);
            const message = channel ? await channel.messages.fetch(giveaway.message_id).catch(() => null) : null;

            if (message) {
                const embed = EmbedBuilder.from(message.embeds[0]);
                embed.setTitle(`${BRAND.NAME} ${newData.prize} Giveaway`);
                embed.setDescription(`Ends: <t:${Math.floor(newData.end_at / 1000)}:R> (<t:${Math.floor(newData.end_at / 1000)}:f>)\nHosted by: <@${giveaway.hosted_by}>\nEntries: ${db.getEntryCount(giveaway.id)}\nWinners: ${newData.winner_count}`);
                await message.edit({ embeds: [embed] }).catch(() => null);
            }

            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(COLORS.SUCCESS).setDescription(`**${EMOJIS.SUCCESS} Giveaway updated successfully.**`)],
                flags: MessageFlags.Ephemeral
            });
        }

        if (subcommand === 'pause') {
            const query = interaction.options.getString('query');
            await giveawayManager.pause(query, interaction);
        }

        if (subcommand === 'resume') {
            const query = interaction.options.getString('query');
            await giveawayManager.resume(query, interaction);
        }

        if (subcommand === 'delete') {
            const query = interaction.options.getString('query');
            await giveawayManager.delete(query, interaction);
        }
    }
};
