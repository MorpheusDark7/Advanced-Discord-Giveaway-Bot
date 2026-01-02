const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const db = require('../database/server');
const { COLORS, EMOJIS, BRAND } = require('../config/constants');

class GiveawayManager {
    constructor() {
        this.client = null;
        this.interval = null;
    }

    init(client) {
        this.client = client;
        this.interval = setInterval(() => this.checkGiveaways(), 10000);
        console.log('[MANAGER] Giveaway background checker started.');
        this.checkGiveaways();
    }

    async checkGiveaways() {
        const activeGiveaways = db.getActiveGiveaways();
        const now = Date.now();

        for (const giveaway of activeGiveaways) {
            if (giveaway.status === 'active' && now >= giveaway.end_at) {
                await this.endGiveaway(giveaway.id);
            }
        }
    }

    async endGiveaway(id) {
        const giveaway = db.getGiveaway(id);
        if (!giveaway || (giveaway.status !== 'active' && giveaway.status !== 'paused')) return;

        console.log(`[MANAGER] Ending giveaway: ${giveaway.prize} (${id})`);

        const channel = await this.client.channels.fetch(giveaway.channel_id).catch(() => null);
        if (!channel) {
            db.updateGiveawayStatus(giveaway.id, 'ended');
            return;
        }

        const message = await channel.messages.fetch(giveaway.message_id).catch(() => null);
        const winners = await this._pickWinners(giveaway.id, giveaway.winner_count, giveaway.guild_id);

        db.updateGiveawayStatus(giveaway.id, 'ended');
        if (winners.length > 0) {
            db.addWinners(giveaway.id, winners);
        }

        if (message) {
            const embed = EmbedBuilder.from(message.embeds[0]);
            embed.setColor(COLORS.NEUTRAL);
            embed.setDescription(`**Giveaway Ended!**\n\n${EMOJIS.WINNER} **Winners:** ${winners.length > 0 ? winners.map(w => `<@${w}>`).join(', ') : '**No participants.**'}`);

            const row = ActionRowBuilder.from(message.components[0]);
            row.components.forEach(c => c.setDisabled(true));

            await message.edit({ embeds: [embed], components: [row] }).catch(() => null);

            if (winners.length > 0) {
                await channel.send({
                    content: `Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won the **${BRAND.NAME} ${giveaway.prize}**!`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(COLORS.SUCCESS)
                            .setDescription(`${EMOJIS.GIFT} Check your **${BRAND.DOMAIN}** account for the reward!`)
                    ]
                }).catch(() => null);
            } else {
                await channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(COLORS.ERROR)
                            .setDescription(`**${EMOJIS.ERROR} The giveaway for ${giveaway.prize} has ended, but there were no participants.**`)
                    ]
                }).catch(() => null);
            }
        }
    }

    async reroll(id, interaction) {
        const giveaway = db.getGiveaway(id);
        if (!giveaway) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`**${EMOJIS.ERROR} Giveaway not found.**`)],
                flags: MessageFlags.Ephemeral
            });
        }

        const winners = await this._pickWinners(giveaway.id, giveaway.winner_count, giveaway.guild_id);
        if (winners.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`**${EMOJIS.ERROR} No participants to reroll.**`)],
                flags: MessageFlags.Ephemeral
            });
        }

        db.updateGiveawayStatus(giveaway.id, 'rerolled');
        db.addWinners(giveaway.id, winners);

        const channel = await this.client.channels.fetch(giveaway.channel_id).catch(() => null);
        if (channel) {
            await channel.send({
                content: `Reroll: Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won the **${BRAND.NAME} ${giveaway.prize}**!`,
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLORS.SUCCESS)
                        .setDescription(`${EMOJIS.GIFT} Check your **${BRAND.DOMAIN}** account for the reward!`)
                ]
            }).catch(() => null);
        }

        return interaction.reply({
            embeds: [new EmbedBuilder().setColor(COLORS.SUCCESS).setDescription(`**${EMOJIS.SUCCESS} Giveaway rerolled successfully.**`)],
            flags: MessageFlags.Ephemeral
        });
    }

    async _pickWinners(id, winnerCount, guildId) {
        const entries = db.getEntries(id);
        if (entries.length === 0) return [];

        const settings = db.getGuildSettings(guildId);
        const boostedRoles = JSON.parse(settings.boosted_roles || '[]');
        const guild = await this.client.guilds.fetch(guildId).catch(() => null);

        const weightedEntries = [];
        for (const entry of entries) {
            let weight = 1;
            if (guild && boostedRoles.length > 0) {
                const member = await guild.members.fetch(entry.user_id).catch(() => null);
                if (member && boostedRoles.some(roleId => member.roles.cache.has(roleId))) {
                    weight = 2;
                }
            }

            for (let i = 0; i < weight; i++) {
                weightedEntries.push(entry.user_id);
            }
        }

        const winners = [];
        for (let i = 0; i < winnerCount; i++) {
            if (weightedEntries.length === 0) break;
            const randomIndex = Math.floor(Math.random() * weightedEntries.length);
            const winnerId = weightedEntries[randomIndex];
            winners.push(winnerId);
            while (weightedEntries.indexOf(winnerId) !== -1) {
                weightedEntries.splice(weightedEntries.indexOf(winnerId), 1);
            }
        }
        return winners;
    }

    async pause(id, interaction) {
        const giveaway = db.getGiveaway(id);
        if (!giveaway || giveaway.status !== 'active') {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`**${EMOJIS.ERROR} Giveaway not found or already paused/ended.**`)],
                flags: MessageFlags.Ephemeral
            });
        }

        db.updateGiveawayStatus(giveaway.id, 'paused');

        const channel = await this.client.channels.fetch(giveaway.channel_id).catch(() => null);
        const message = channel ? await channel.messages.fetch(giveaway.message_id).catch(() => null) : null;

        if (message) {
            const embed = EmbedBuilder.from(message.embeds[0]);
            embed.setColor(COLORS.ERROR);
            const desc = embed.data.description;
            embed.setDescription(`**GIVEAWAY PAUSED**\n${desc}`);
            await message.edit({ embeds: [embed] }).catch(() => null);
        }

        return interaction.reply({
            embeds: [new EmbedBuilder().setColor(COLORS.SUCCESS).setDescription(`**${EMOJIS.SUCCESS} Giveaway paused.**`)],
            flags: MessageFlags.Ephemeral
        });
    }

    async resume(id, interaction) {
        const giveaway = db.getGiveaway(id);
        if (!giveaway || giveaway.status !== 'paused') {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`**${EMOJIS.ERROR} Giveaway is not paused.**`)],
                flags: MessageFlags.Ephemeral
            });
        }

        db.updateGiveawayStatus(giveaway.id, 'active');

        const channel = await this.client.channels.fetch(giveaway.channel_id).catch(() => null);
        const message = channel ? await channel.messages.fetch(giveaway.message_id).catch(() => null) : null;

        if (message) {
            const embed = EmbedBuilder.from(message.embeds[0]);
            embed.setColor(COLORS.PRIMARY);
            const desc = embed.data.description.replace('**GIVEAWAY PAUSED**\n', '');
            embed.setDescription(desc);
            await message.edit({ embeds: [embed] }).catch(() => null);
        }

        return interaction.reply({
            embeds: [new EmbedBuilder().setColor(COLORS.SUCCESS).setDescription(`**${EMOJIS.SUCCESS} Giveaway resumed.**`)],
            flags: MessageFlags.Ephemeral
        });
    }

    async delete(id, interaction) {
        const giveaway = db.getGiveaway(id);
        if (!giveaway) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`**${EMOJIS.ERROR} Giveaway not found.**`)],
                flags: MessageFlags.Ephemeral
            });
        }

        const channel = await this.client.channels.fetch(giveaway.channel_id).catch(() => null);
        const message = channel ? await channel.messages.fetch(giveaway.message_id).catch(() => null) : null;

        if (message) await message.delete().catch(() => null);
        db.deleteGiveaway(giveaway.id);

        return interaction.reply({
            embeds: [new EmbedBuilder().setColor(COLORS.SUCCESS).setDescription(`**${EMOJIS.SUCCESS} Giveaway deleted.**`)],
            flags: MessageFlags.Ephemeral
        });
    }
}

module.exports = new GiveawayManager();
