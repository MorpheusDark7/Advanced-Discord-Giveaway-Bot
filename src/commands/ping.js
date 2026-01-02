const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { COLORS, EMOJIS } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot latency')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        const response = await interaction.reply({
            embeds: [new EmbedBuilder().setColor(COLORS.PRIMARY).setDescription(`** ${EMOJIS.TIMER} Pinging...** `)],
            flags: MessageFlags.Ephemeral,
            withResponse: true
        });
        const sent = response.resource.message;
        const latency = sent.createdTimestamp - interaction.createdTimestamp;

        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor(COLORS.SUCCESS)
                .setDescription(`** ${EMOJIS.SUCCESS} Pong! Latency: ${latency} ms | API Latency: ${Math.round(interaction.client.ws.ping)} ms ** `)
            ]
        });
    },
};
