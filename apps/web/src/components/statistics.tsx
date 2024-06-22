'use client';

import { CandlestickChartIcon, LucideIcon, ServerIcon, TerminalSquareIcon, Users2Icon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils';

export default function Statistics({
    guilds,
    users,
    commands,
    investments,
}: {
    guilds: number;
    users: number;
    commands: number;
    investments: number;
}) {
    const serverCount = formatNumber(guilds);
    const userCount = formatNumber(users);

    return (
        <>
            <Statistic Icon={ServerIcon} title="Servers" value={serverCount.value} suffix={serverCount.suffix + '+'} />
            <Statistic Icon={Users2Icon} title="Users" value={userCount.value} suffix={userCount.suffix + '+'} />
            <Statistic Icon={TerminalSquareIcon} title="Commands" value={commands} />
            <Statistic Icon={CandlestickChartIcon} title="Investments" value={investments} />
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
