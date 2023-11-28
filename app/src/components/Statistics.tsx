'use client';

import { CandlestickChartIcon, LucideIcon, ServerIcon, TerminalSquareIcon, Users2Icon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BotStats } from '@prisma/client';

function formatNumber(num: number): string {
    // If the number is less than 20,000, return it as is
    if (num < 20000) {
        return num.toString();
    }

    // Round the number to the nearest 10,000
    const rounded = Math.round(num / 10000) * 10000;

    // Format the number in 'K' or 'M'
    if (rounded < 1000000) {
        return rounded / 1000 + 'K';
    } else {
        return (rounded / 1000000).toFixed(1) + 'M';
    }
}

export default function Statistics({ botStats }: { botStats: BotStats }) {
    const serverCount = formatNumber(botStats.guilds);
    const userCount = formatNumber(botStats.users);

    return (
        <>
            <Statistic
                Icon={ServerIcon}
                title="Servers"
                value={serverCount.shortValue}
                suffix={serverCount.suffix + '+'}
            />
            <Statistic Icon={Users2Icon} title="Users" value={userCount.shortValue} suffix={userCount.suffix + '+'} />
            <Statistic Icon={TerminalSquareIcon} title="Commands" value={35} />
            <Statistic Icon={CandlestickChartIcon} title="Investments" value={70} />
        </>
    );
}

export function Statistic({
    Icon,
    title,
    value,
    suffix = '',
}: {
    Icon: LucideIcon;
    title: string;
    value: number;
    suffix?: string;
}) {
    const incrementValue = value / Math.ceil(2e3 / 25);
    const [state, setState] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            if (state < value) {
                setState(state + incrementValue);
            } else if (state >= value) {
                setState(value);
                clearInterval(interval);
            }
        }, 25);

        return () => clearInterval(interval);
    }, [state, value, incrementValue]);

    return (
        <div className="flex justify-between items-center gap-4">
            <Icon className="text-primary h-12 w-12" />

            <div>
                <h2 className="text-3xl font-semibold">
                    {Math.ceil(state)}
                    {suffix}
                </h2>
                <p className="text-muted font-semibold -mt-1">{title}</p>
            </div>
        </div>
    );
}
