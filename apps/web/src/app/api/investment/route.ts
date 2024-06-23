import { env } from '@/env';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function GET() {
    const investments = await db.investment.findMany({});
    return NextResponse.json(investments, { status: 200 });
}

const investmentBodySchema = z.object({
    userId: z.string(),
    type: z.enum(['BUY', 'SELL']),
    ticker: z.string(),
    amount: z.number().min(0).max(20_000_000),
});

export async function PUT(request: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'You need to be logged in to use this feature.' }, { status: 401 });
    }

    const body = await request.json();
    const parsedBody = investmentBodySchema.safeParse(body);
    if (!parsedBody.success) {
        return NextResponse.json(
            { error: 'Something went wrong... Please refresh the page and try again.' },
            { status: 400 },
        );
    }

    if (parsedBody.data.userId !== session.user.discordId) {
        return NextResponse.json({ error: 'You need to be logged in to use this feature.' }, { status: 401 });
    }

    const member = await db.members.findUnique({
        where: { userId: session.user.discordId },
    });

    const userStats = await db.userstats.findUnique({
        where: { userId: session.user.discordId },
    });
    if (!member || !userStats) {
        return NextResponse.json(
            { error: 'You need to have used Coinz before buying your first investment.' },
            { status: 404 },
        );
    }

    const investment = await db.investment.findFirst({
        where: {
            ticker: parsedBody.data.ticker,
        },
    });
    if (!investment) {
        return NextResponse.json(
            { error: `Investment with ticker "${parsedBody.data.ticker}" is not found.` },
            { status: 404 },
        );
    }

    const totalPrice = parseFloat(investment.price) * parsedBody.data.amount;
    if (parsedBody.data.type === 'BUY') {
        if (totalPrice < 50) {
            return NextResponse.json({ error: 'Minimum investment is 50.' }, { status: 400 });
        } else if (totalPrice > member.wallet) {
            return NextResponse.json(
                { error: 'You do not have enough money to buy this investment.' },
                { status: 400 },
            );
        }
    }

    const ownedInvestment = member.investments.find((i) => i.ticker === parsedBody.data.ticker);
    if (parsedBody.data.type === 'SELL' && !ownedInvestment) {
        return NextResponse.json({ error: 'You do not own this investment.' }, { status: 400 });
    }

    const ownInvestmentAmount = parseFloat(ownedInvestment?.amount ?? '0');
    if (parsedBody.data.type === 'BUY') {
        if (ownInvestmentAmount + parsedBody.data.amount > 20_000_000) {
            return NextResponse.json(
                { error: 'You cannot own more than 20,000,000 shares of the same investment.' },
                { status: 400 },
            );
        }
    } else {
        if (ownInvestmentAmount < parsedBody.data.amount) {
            return NextResponse.json({ error: 'You do not have enough shares to sell.' }, { status: 400 });
        }
    }

    try {
        const response = await fetch(`${env.API_URL}/member/investment`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${env.API_TOKEN}`,
            },
            body: JSON.stringify({
                userId: session.user.discordId,
                type: parsedBody.data.type,
                ticker: parsedBody.data.ticker,
                amount: parsedBody.data.amount,
                price: totalPrice,
            }),
        });

        console.log(response.status, response.statusText, await response.json());

        if (response.status !== 200) {
            return NextResponse.json({ error: 'Could not fetch data from the server.' }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Could not fetch data from the server.' }, { status: 500 });
    }

    await db.members.update({
        where: { userId: session.user.discordId },
        data: {
            wallet: {
                increment: parsedBody.data.type === 'BUY' ? -totalPrice : totalPrice,
            },
        },
    });

    const amountOfTimesBought = userStats.investments.amountOfTimesBought ?? 0;
    const amountOfTimesSold = userStats.investments.amountOfTimesSold ?? 0;
    const totalBuyPrice = userStats.investments.totalBuyPrice ?? 0;
    await db.userstats.update({
        where: { userId: session.user.discordId },
        data: {
            investments: {
                amountOfTimesBought: parsedBody.data.type === 'BUY' ? amountOfTimesBought + 1 : amountOfTimesBought,
                amountOfTimesSold: parsedBody.data.type === 'SELL' ? amountOfTimesSold + 1 : amountOfTimesSold,
                totalBuyPrice: parsedBody.data.type === 'BUY' ? Math.floor(totalBuyPrice + totalPrice) : totalBuyPrice,
            },
        },
    });

    return NextResponse.json(
        {
            message: `You successfully ${parsedBody.data.type === 'BUY' ? 'bought' : 'sold'} ${parsedBody.data.amount}x ${investment.fullName} (${investment.ticker}) ${investment.type === 'Stock' ? 'shares' : 'coins'}.`,
        },
        { status: 200 },
    );
}
