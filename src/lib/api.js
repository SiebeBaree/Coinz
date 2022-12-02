import { Webhook } from "@top-gg/sdk"
import express from "express"
import { processVote } from "./vote.js"
import { schedule } from "node-cron"
import axios from "axios"
import { AutoPoster } from "topgg-autoposter"
import { readFile } from 'fs/promises'

const app = express();

if (process.env.NODE_ENV === "production") {
    app.use(express.json());

    const topggWebhook = new Webhook(process.env.TOPGG_VOTE_WEBHOOK);
    app.post("/topggwebhook", topggWebhook.listener(async (vote) => { await processVote(vote.user, "top.gg"); }));
    app.post("/dblwebhook", async (request) => { await processVote(request.body.id, "dbl") });

    AutoPoster(process.env.API_TOPGG, bot);
    schedule('0 * * * *', async function () {
        const stats = JSON.parse(
            await readFile(new URL('./src/assets/stats.json', import.meta.url))
        );

        await axios.post('https://discordbotlist.com/api/v1/bots/938771676433362955/stats', {
            guilds: stats.guilds,
            users: stats.members
        }, {
            headers: {
                "Authorization": process.env.API_DISCORDBOTLIST
            }
        });
    });
}

export default app;