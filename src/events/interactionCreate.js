const { Events, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../database/server');
const { COLORS, EMOJIS, BUTTON_IDS } = require('../config/constants');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`[COMMAND ERROR] ${interaction.commandName}:`, error);
                const embed = new EmbedBuilder()
                    .setColor(COLORS.ERROR)
                    .setDescription(`**${EMOJIS.ERROR} There was an error executing this command.**`);

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId.startsWith(BUTTON_IDS.ENTER_GIVEAWAY)) {
                const giveawayId = interaction.customId.split('_').pop();
                const giveaway = db.getGiveaway(giveawayId);

                if (!giveaway || giveaway.status !== 'active') {
                    const statusText = giveaway?.status === 'paused' ? 'paused' : 'already ended';
                    return interaction.reply({
                        embeds: [new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`**${EMOJIS.ERROR} This giveaway is ${statusText}.**`)],
                        flags: MessageFlags.Ephemeral
                    });
                }

                const entries = db.getEntries(giveaway.id);
                const hasEntered = entries.some(e => e.user_id === interaction.user.id);

                if (hasEntered) {
                    return interaction.reply({
                        embeds: [new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`**${EMOJIS.ERROR} You have already entered this giveaway!**`)],
                        flags: MessageFlags.Ephemeral
                    });
                }

                db.addEntry(giveaway.id, interaction.user.id);
                const count = db.getEntryCount(giveaway.id);

                const message = interaction.message;
                if (message && message.embeds.length > 0) {
                    const embed = EmbedBuilder.from(message.embeds[0]);
                    const description = embed.data.description || '';
                    const updatedDescription = description.replace(/Entries: \d+/, `Entries: ${count}`);
                    embed.setDescription(updatedDescription);
                    await message.edit({ embeds: [embed] }).catch(console.error);
                }

                await interaction.reply({
                    embeds: [new EmbedBuilder().setColor(COLORS.SUCCESS).setDescription(`**${EMOJIS.SUCCESS} You have entered the giveaway! (Total Entries: ${count})**`)],
                    flags: MessageFlags.Ephemeral
                });

                console.log(`[INTERACTION] ${interaction.user.tag} entered giveaway ${giveaway.id}`);
            }
        }
    },
};
