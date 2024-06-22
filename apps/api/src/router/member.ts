import { Hono } from 'hono';
import Member from '../schemas/member';

const app = new Hono();

type InvestmentBody = {
    type: 'BUY' | 'SELL';
    userId: string;
    ticker: string;
    amount: number;
    price: number;
};

app.put('/investment', async (c) => {
    const authKey = c.req.header('Authorization');
    if (authKey !== process.env.TOKEN!) {
        return c.json({ error: 'Invalid auth key' }, 401);
    }

    const body: InvestmentBody = await c.req.json();
    if (!['BUY', 'SELL'].includes(body.type)) {
        return c.json({ error: 'Invalid type' }, 400);
    }

    const member = await Member.findOne({ id: body.userId });
    if (!member) {
        return c.json({ error: 'Member not found' }, 404);
    }

    if (member.premium < 2) {
        return c.json(
            {
                error: 'You need Coinz Pro to use the web interface. Please upgrade your account.',
            },
            403,
        );
    }

    const ownedInvestment = member.investments.find((i) => i.ticker === body.ticker);
    if (body.type === 'BUY') {
        console.log(`${body.userId} bought ${body.amount} of ${body.ticker} for ${body.price}`);
        if (ownedInvestment) {
            await Member.updateOne(
                { id: member.id, 'investments.ticker': body.ticker },
                {
                    $set: {
                        'investments.$.amount': `${Number.parseFloat(ownedInvestment.amount) + body.amount}`,
                    },
                    $inc: {
                        'investments.$.buyPrice': Math.round(body.price),
                    },
                },
            );
        } else {
            await Member.updateOne(
                { id: member.id },
                {
                    $push: {
                        investments: {
                            ticker: body.ticker,
                            amount: body.amount,
                            buyPrice: body.price,
                        },
                    },
                },
            );
        }
    } else {
        if (!ownedInvestment) {
            return c.json({ error: 'Investment not found' }, 404);
        }

        console.log(`${body.userId} sold ${body.amount} of ${body.ticker} for ${body.price}`);
        const ownedAmount = Number.parseFloat(ownedInvestment.amount);
        if (Number.parseFloat(ownedInvestment.amount) <= body.amount || ownedAmount - body.amount < 0.00001) {
            await Member.updateOne(
                { id: member.id },
                {
                    $pull: { investments: { ticker: ownedInvestment.ticker } },
                },
            );
        } else {
            await Member.updateOne(
                { id: member.id, 'investments.ticker': body.ticker },
                {
                    $set: {
                        'investments.$.amount': `${ownedAmount - body.amount}`,
                    },
                    $inc: {
                        'investments.$.buyPrice': -Math.floor((body.amount / ownedAmount) * ownedInvestment.buyPrice),
                    },
                },
            );
        }
    }

    return c.json({ success: true }, 200);
});

export default app;
