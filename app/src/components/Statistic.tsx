"use client";

import React, { useEffect, useState } from "react";

export function Statistic({ Icon, title, value, suffix = "" }: {
    Icon: React.ReactNode,
    title: string,
    value: number,
    suffix?: string
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
            {Icon}

            <div>
                <h2 className="text-3xl font-semibold">{Math.ceil(state)}{suffix}</h2>
                <p className="text-muted font-semibold -mt-1">{title}</p>
            </div>
        </div>
    );
}