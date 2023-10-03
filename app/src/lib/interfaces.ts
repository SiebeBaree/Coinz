import React from "react";

export interface IconProps {
    fill?: string;
    className?: string;
    style?: React.CSSProperties;
}

export interface Item {
    itemId: string;
    category: string;
    name: string;
    emoteId: string;
    description: string;
    longDescription?: string;
    buyPrice?: number;
    sellPrice?: number;
    multiplier?: number;
    duration?: number;
}

export interface Changelog {
    version: string;
    name: string;
    timestamp: number;
    content: string[];
}

export interface Cluster {
    id: number;
    shards: Shard[];
}

export interface Shard {
    id: number;
    ping: number;
    guildcount: number;
}