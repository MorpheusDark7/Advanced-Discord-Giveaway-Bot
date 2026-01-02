require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');
const giveawayManager = require('./utils/giveawayManager');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions
    ]
});

client.commands = new Collection();

commandHandler(client);
eventHandler(client);

process.on('unhandledRejection', error => {
    console.error('[CLIENT] Unhandled promise rejection:', error);
});

client.login(process.env.DISCORD_TOKEN).then(() => {
    console.log(`[CLIENT] Logged in as ${client.user.tag}`);
    giveawayManager.init(client);
});
