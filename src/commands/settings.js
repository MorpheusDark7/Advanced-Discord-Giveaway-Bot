const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../database/server');
const { COLORS, EMOJIS, BRAND } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure bot settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName('boosted-roles')
                .setDescription('Set roles that get 2x luck in giveaways')
                .addRoleOption(opt => opt.setName('role1').setDescription('First boosted role').setRequired(true))
                .addRoleOption(opt => opt.setName('role2').setDescription('Second boosted role'))
                .addRoleOption(opt => opt.setName('role3').setDescription('Third boosted role'))
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'boosted-roles') {
            const role1 = interaction.options.getRole('role1');
            const role2 = interaction.options.getRole('role2');
            const role3 = interaction.options.getRole('role3');

            const roleIds = [role1.id];
            if (role2) roleIds.push(role2.id);
            if (role3) roleIds.push(role3.id);

            db.updateBoostedRoles(interaction.guildId, roleIds);

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.SUCCESS)
                    .setDescription(`**${EMOJIS.SUCCESS} Boosted roles updated!**\n\nRoles: ${roleIds.map(id => `<@&${id}>`).join(', ')}`)
                ],
                flags: MessageFlags.Ephemeral
            });

            console.log(`[SETTINGS] Boosted roles updated for guild ${interaction.guildId}`);
        }
    }
};
