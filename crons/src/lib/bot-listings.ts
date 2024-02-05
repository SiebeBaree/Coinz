import process from 'node:process';
import tokens from '../data/tokens.json';
import type { BotListing } from './types';

export default class ApiController {
    private readonly variables: Map<string, number | string> = new Map();

    public constructor(serverCount: number, shardCount: number, memberCount: number) {
        this.variables.set('$SERVER_COUNT', serverCount);
        this.variables.set('$SHARD_COUNT', shardCount);
        this.variables.set('$MEMBER_COUNT', memberCount);
    }

    public async sendApiCall(listing: BotListing): Promise<boolean> {
        try {
            if (listing.api.length <= 0) return false;
            const API_URL = listing.api.replace('$ID', process.env.BOT_ID!);

            if (!listing.body) listing.body = {};
            if (!listing.headers) {
                listing.headers = {
                    Authorization: '$TOKEN',
                };
            }

            const headers = this.convertToHeaders(this.getFields(listing.name, listing.headers));
            const body = this.getFields(listing.name, listing.body);

            const response = await fetch(API_URL, {
                method: listing.method || 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });

            if (response.status !== 200 && response.status !== 204) {
                try {
                    console.log('ERROR:', listing.name, response.status, await response.json());
                } catch {
                    console.log(`ERROR: ${listing.name} ${response.status} BODY FAILED...`);
                }
            }

            return response.status === 200 || response.status === 204;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    private getFields(name: string, fields: { [key: string]: number | string }): { [key: string]: number | string } {
        const keys = Object.keys(fields);
        for (const key of keys) {
            const value = fields[key];
            if (value === undefined) continue;

            if (value.toString().includes('$TOKEN')) {
                fields[key] = value.toString().replace('$TOKEN', this.getToken(name));
            } else {
                fields[key] = this.replaceVariable(value.toString());
            }
        }

        return fields;
    }

    private convertToHeaders(headers: { [key: string]: number | string }): Headers {
        const newHeaders = new Headers();
        for (const [key, value] of Object.entries(headers)) {
            newHeaders.set(key, value.toString());
        }

        newHeaders.set('Content-Type', 'application/json');
        return newHeaders;
    }

    private replaceVariable(variable: string): number | string {
        let newVariable = variable;
        for (const [key, value] of this.variables.entries()) {
            newVariable = variable.replace(key, value.toString());
            if (variable !== newVariable) {
                try {
                    return Number.parseInt(newVariable, 10);
                } catch {
                    return newVariable;
                }
            }
        }

        return newVariable;
    }

    private getToken(name: string): string {
        const tokenKeys = Object.keys(tokens);
        const validOptions = tokenKeys.filter((tk) => tk === `${name}_TOKEN`);
        if (validOptions.length <= 0) {
            return '';
        }

        return (tokens as { [key: string]: string })[validOptions[0]!]!;
    }
}
