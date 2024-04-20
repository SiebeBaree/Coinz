import { Hono } from 'hono';
import { processVote } from '../utils/vote';
import { Website } from '../utils/enums';
import { send } from '../queues/vote';
import { DBLWebhook, TopGGWebhook } from '../utils/types';

const app = new Hono();

app.post('/topgg', async (c) => {
    const authKey = c.req.header('Authorization');
    if (authKey !== process.env.TOPGG_AUTH_KEY) {
        return c.json({ error: 'Invalid auth key' }, 401);
    }

    const body: TopGGWebhook = await c.req.json();
    if (body.type !== 'upvote') {
        return c.json({ error: 'Invalid vote type' }, 400);
    }

    const voteResponse = await processVote(body.user, Website.TopGG);

    try {
        if (voteResponse.sendMessage) {
            send(
                JSON.stringify({
                    userId: body.user,
                    website: Website.TopGG,
                    votes: voteResponse.totalVotes,
                    spins: voteResponse.totalSpins,
                }),
            );
        }
    } catch {
        console.log(`Failed to send vote message for ${body.user} on ${Website.TopGG}`);
    }

    return c.json({ success: true }, 200);
});

app.post('/dbl', async (c) => {
    const authKey = c.req.header('Authorization');
    if (authKey !== process.env.DBL_AUTH_KEY) {
        return c.json({ error: 'Invalid auth key' }, 401);
    }

    const body: DBLWebhook = await c.req.json();
    const voteResponse = await processVote(body.id, Website.DiscordBotList);

    try {
        if (voteResponse.sendMessage) {
            send(
                JSON.stringify({
                    userId: body.id,
                    website: Website.DiscordBotList,
                    votes: voteResponse.totalVotes,
                    spins: voteResponse.totalSpins,
                }),
            );
        }
    } catch {
        console.log(`Failed to send vote message for ${body.id} on ${Website.DiscordBotList}`);
    }

    return c.json({ success: true }, 200);
});

export default app;
