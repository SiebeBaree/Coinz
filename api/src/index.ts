import process from 'node:process';
import express from 'express';
import Stats from 'sharding-stats';
import cors from 'cors';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.urlencoded({ extended: true }));

const StatsServer = new Stats.Server(app, {
    selfHost: true,
    bot: {
        name: process.env.BOT_NAME || 'Bot',
        icon: process.env.BOT_ICON || 'https://cdn.discordapp.com/embed/avatars/0.png',
        website: process.env.BOT_WEBSITE || 'https://discord.com',
        client_id: process.env.BOT_CLIENT_ID || '0',
        client_secret: process.env.BOT_CLIENT_SECRET || '0',
    },
    stats_uri: process.env.API_URL,
    owners: [process.env.BOT_OWNER_IDS?.split(',') || '0'],
    authorizationkey: process.env.AUTHORIZATION_KEY,
});

StatsServer.on('error', console.log);

app.get('/status', (req, res) => {
    const data = StatsServer.getStatsData().raw.shards;
    const sorted = StatsServer.chunkShardsToClusterArrays(data);

    console.log(sorted);
    res.send('OK');
});

const port = process.env.PORT || 3300;
app.listen(port, () => {
    console.log(`Listening on port ${port}!`);
});

process.on('uncaughtException', (err: Error) => {
    console.error(err.stack);
});

process.on('unhandledRejection', (err: Error) => {
    console.error(err.stack);
});