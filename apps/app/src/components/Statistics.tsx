'use client';

import { CandlestickChartIcon, LucideIcon, ServerIcon, TerminalSquareIcon, Users2Icon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BotStats } from '@prisma/client';
import { formatNumber } from '@/lib/utils';

export default function Statistics({ botStats }: { botStats: BotStats | null }) {
    if (!botStats) {
        return (
            <>
                <Statistic Icon={ServerIcon} title="Servers" value={0} />
                <Statistic Icon={Users2Icon} title="Users" value={0} />
                <Statistic Icon={TerminalSquareIcon} title="Commands" value={0} />
                <Statistic Icon={CandlestickChartIcon} title="Investments" value={0} />
            </>
        );
    }

    const serverCount = formatNumber(botStats.guilds);
    const userCount = formatNumber(botStats.users);

    return (
        <>
            <Statistic Icon={ServerIcon} title="Servers" value={serverCount.value} suffix={serverCount.suffix + '+'} />
            <Statistic Icon={Users2Icon} title="Users" value={userCount.value} suffix={userCount.suffix + '+'} />
            <Statistic Icon={TerminalSquareIcon} title="Commands" value={botStats.commands} />
            <Statistic Icon={CandlestickChartIcon} title="Investments" value={botStats.investments} />
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
        <div className="flex justify-center items-center gap-4">
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
