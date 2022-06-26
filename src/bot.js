require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const { Client, Collection, Intents } = require('discord.js');
const dbots = require('dbots');

// Initialising a Client object
const intents = [Intents.FLAGS.GUILDS];
const client = new Client({ intents: intents });

// Creating collections and importing general items
client.commands = new Collection();
client.event = new Collection();
client.config = require('./config.json');
client.database = require('./database/mongoose');

// importing all general tools
client.logger = require('./tools/logger');
client.cooldown = require('./tools/cooldown');
client.calc = require('./tools/calculators');
client.tools = require('./tools/tools');
client.resolvers = require('./tools/resolvers');

async function init() {
    // Event handler
    const eventFiles = fs.readdirSync('./src/events/').filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(`${process.cwd()}/src/events/${file}`);
        const eventName = file.split(".")[0];
        client.logger.load(`Listening to ${eventName} event.`);
        client.on(eventName, event.bind(null, client));
    }

    // Command Handler
    let commandFolder = await readdir("./src/commands/");
    commandFolder.forEach(dir => {
        // Ignored . folders
        if (!dir.startsWith(".")) {
            const commandFiles = fs.readdirSync('./src/commands/' + dir + "/").filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`${process.cwd()}/src/commands/${dir}/${file}`);

                try {
                    client.commands.set(command.help.name, command);
                } catch (err) {
                    client.logger.error(`An unexpected error occured with COMMAND ${file}.`);
                }
            }
        }
    })

    // Connect to the database
    try {
        await mongoose.connect(process.env.DATABASE_URI, {
            dbName: 'coinz',
            keepAlive: true,
            keepAliveInitialDelay: 300000
        });
        client.logger.ready(`Connected to MongoDB.`);

        // removing all expired command cooldowns to clean database
        const cooldownsSchema = require('./database/schemas/cooldowns');
        client.logger.log(`Cleaning up cooldowns collection...`);
        const deleted = await cooldownsSchema.deleteMany({ expiresOn: { $lte: parseInt(Date.now() / 1000) } });
        client.logger.log(`Cleaned up ${deleted.deletedCount} documents.`);
    } catch (e) {
        client.logger.error('Unable to connect to MongoDB Database.\nError: ' + e);
    }

    await client.login(process.env.TOKEN);

    // Make sure the client has logged in before initializing a poster.
    client.on('ready', () => {
        const poster = new dbots.Poster({
            client,
            apiKeys: {
                discordbotlist: process.env.API_DISCORDBOTLIST,
                discordbotsgg: {
                    token: process.env.API_DISCORDBOTSGG,
                    userAgent: {
                        clientID: '938771676433362955',
                        library: 'discord.js'
                    }
                },
                discords: process.env.API_DISCORDS,
                disforge: process.env.API_DISFORGE,
                topgg: process.env.API_TOPGG
            },
            clientLibrary: 'discord.js'
        })

        // Starts an interval thats posts to all services every 30 minutes.
        poster.startInterval();
        client.logger.ready("Poster is online.");
    })
}

init();

process.on('unhandledRejection', err => {
    client.logger.error(`Unknown error occured:\n`);
    console.log(err)
})

module.exports.client = client;