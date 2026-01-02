const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class ServerData {
    constructor() {
        const dbPath = path.resolve(__dirname, '../../database.db');
        this.db = new Database(dbPath);
        this.initialize();
    }

    initialize() {
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS giveaways (
                id TEXT PRIMARY KEY,
                message_id TEXT,
                channel_id TEXT,
                guild_id TEXT,
                prize TEXT,
                winner_count INTEGER,
                end_at INTEGER,
                hosted_by TEXT,
                status TEXT DEFAULT 'active'
            )
        `).run();

        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS entries (
                giveaway_id TEXT,
                user_id TEXT,
                PRIMARY KEY (giveaway_id, user_id),
                FOREIGN KEY (giveaway_id) REFERENCES giveaways(id) ON DELETE CASCADE
            )
        `).run();

        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS winners (
                giveaway_id TEXT,
                user_id TEXT,
                PRIMARY KEY (giveaway_id, user_id),
                FOREIGN KEY (giveaway_id) REFERENCES giveaways(id) ON DELETE CASCADE
            )
        `).run();

        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id TEXT PRIMARY KEY,
                boosted_roles TEXT
            )
        `).run();

        console.log('[DATABASE] Initialization complete.');
    }

    getGuildSettings(guildId) {
        const settings = this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
        if (!settings) return { guild_id: guildId, boosted_roles: '[]' };
        return settings;
    }

    updateBoostedRoles(guildId, roleIds) {
        const stmt = this.db.prepare('INSERT OR REPLACE INTO guild_settings (guild_id, boosted_roles) VALUES (?, ?)');
        return stmt.run(guildId, JSON.stringify(roleIds));
    }

    createGiveaway(data) {
        const stmt = this.db.prepare(`
            INSERT INTO giveaways (id, message_id, channel_id, guild_id, prize, winner_count, end_at, hosted_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `);
        return stmt.run(data.id, data.message_id, data.channel_id, data.guild_id, data.prize, data.winner_count, data.end_at, data.hosted_by);
    }

    getGiveaway(id) {
        let giveaway = this.db.prepare('SELECT * FROM giveaways WHERE id = ?').get(id);
        if (!giveaway) {
            giveaway = this.db.prepare('SELECT * FROM giveaways WHERE message_id = ?').get(id);
        }
        return giveaway;
    }

    getGiveawaysByGuild(guildId) {
        return this.db.prepare('SELECT * FROM giveaways WHERE guild_id = ?').all(guildId);
    }

    getActiveGiveaways() {
        return this.db.prepare("SELECT * FROM giveaways WHERE status = 'active'").all();
    }

    updateGiveawayStatus(id, status) {
        return this.db.prepare('UPDATE giveaways SET status = ? WHERE id = ? OR message_id = ?').run(status, id, id);
    }

    editGiveaway(id, data) {
        const stmt = this.db.prepare('UPDATE giveaways SET prize = ?, winner_count = ?, end_at = ? WHERE id = ? OR message_id = ?');
        return stmt.run(data.prize, data.winner_count, data.end_at, id, id);
    }

    deleteGiveaway(id) {
        return this.db.prepare('DELETE FROM giveaways WHERE id = ? OR message_id = ?').run(id, id);
    }

    addEntry(giveawayId, userId) {
        const stmt = this.db.prepare('INSERT OR IGNORE INTO entries (giveaway_id, user_id) VALUES (?, ?)');
        return stmt.run(giveawayId, userId);
    }

    getEntries(giveawayId) {
        return this.db.prepare('SELECT user_id FROM entries WHERE giveaway_id = ?').all(giveawayId);
    }

    getEntryCount(giveawayId) {
        const result = this.db.prepare('SELECT COUNT(*) as count FROM entries WHERE giveaway_id = ?').get(giveawayId);
        return result.count;
    }

    addWinners(giveawayId, userIds) {
        const stmt = this.db.prepare('INSERT INTO winners (giveaway_id, user_id) VALUES (?, ?)');
        const transaction = this.db.transaction((id, ids) => {
            for (const userId of ids) {
                stmt.run(id, userId);
            }
        });
        return transaction(giveawayId, userIds);
    }

    getWinners(giveawayId) {
        return this.db.prepare('SELECT user_id FROM winners WHERE giveaway_id = ?').all(giveawayId);
    }
}

module.exports = new ServerData();
