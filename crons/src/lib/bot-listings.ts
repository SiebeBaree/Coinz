import type { BotListing } from './types';
import process from 'node:process';

export default async function sendApiCall(listing: BotListing, serverCount: number, shardCount: number, memberCount: number): Promise<boolean> {
    try {
        const API_URL = listing.api.replace('$ID', process.env.BOT_ID!);
        const response = await fetch(API_URL, {
            method: listing.method || 'POST',
        });
    }
}

function getBody(body: { [key: string]: string }) {

}