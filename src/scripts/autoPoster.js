require('dotenv').config();
const { schedule } = require('node-cron');
const axios = require('axios');
const { AutoPoster } = require('topgg-autoposter');

AutoPoster(process.env.API_TOPGG, bot);
schedule('0 * * * *', async function () {
    const stats = require("../../assets/stats.json");

    await axios.post('https://discordbotlist.com/api/v1/bots/938771676433362955/stats', {
        guilds: stats.guilds,
        users: stats.members
    }, {
        headers: {
            "Authorization": process.env.API_DISCORDBOTLIST
        }
    });
});