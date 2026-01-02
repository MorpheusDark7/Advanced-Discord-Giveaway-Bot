const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { COLORS, EMOJIS, BRAND } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List all available commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`${BRAND.NAME} Help Menu`)
            .setColor(COLORS.PRIMARY)
            .setDescription(`**Available Commands (Manage Guild required):**`)
            .addFields(
                { name: '/giveaway start', value: 'Start a new giveaway with duration, prize, and winners.', inline: false },
                { name: '/giveaway list', value: 'List all active and ended giveaways.', inline: false },
                { name: '/giveaway end [query]', value: 'End an active giveaway early.', inline: false },
                { name: '/giveaway reroll [query]', value: 'Pick new winners for an ended giveaway.', inline: false },
                { name: '/giveaway info [query]', value: 'Show details and entry count for a giveaway.', inline: false },
                { name: '/giveaway edit [query]', value: 'Modify an active giveaway\'s details.', inline: false },
                { name: '/giveaway pause/resume [query]', value: 'Pause or resume giveaway entries.', inline: false },
                { name: '/giveaway delete [query]', value: 'Remove a giveaway and its message.', inline: false },
                { name: '/settings boosted-roles', value: 'Manage roles that get 2x luck.', inline: false }
            )
            .setFooter({ text: BRAND.FOOTER });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },
};
