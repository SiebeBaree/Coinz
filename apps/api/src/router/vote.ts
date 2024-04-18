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
    const voteResponse = await processVote(body.user, Website.TopGG);

    try {
        if (voteResponse.sendMessage) {
            send(`${body.user} voted on ${Website.TopGG}. Type: ${body.type}`);
        }
    } catch {}

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
            send(`${body.id} voted on ${Website.DiscordBotList}. Admin: ${body.admin}`);
        }
    } catch {}

    return c.json({ success: true }, 200);
});

export default app;
