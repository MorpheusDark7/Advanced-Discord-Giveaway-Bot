const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`[EVENT] Bot is ready! Logged in as ${client.user.tag}`);
    },
};
