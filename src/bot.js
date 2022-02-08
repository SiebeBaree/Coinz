require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const { Client, Collection, Intents } = require('discord.js');

// Initialising a Client object
const intents = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES];
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
        const commandFiles = fs.readdirSync('./src/commands/' + dir + "/").filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`${process.cwd()}/src/commands/${dir}/${file}`);

            try {
                client.commands.set(command.help.name, command);
            } catch (err) {
                client.logger.error(`An unexpected error occured with COMMAND ${file}.`);
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
    } catch (e) {
        client.logger.error('Unable to connect to MongoDB Database.\nError: ' + err);
    }

    await client.login(process.env.TOKEN);
}

init();

process.on('unhandledRejection', err => {
    client.logger.error(`Unknown error occured:\n`);
    console.log(err)
})

module.exports.client = client;