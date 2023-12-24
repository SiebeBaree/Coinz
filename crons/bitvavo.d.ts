/* eslint-disable */
declare module "bitvavo" {
    import { EventEmitter } from "events";

    export interface BitvavoOptions {
        APIKEY: string;
        APISECRET: string;
        ACCESSWINDOW: number;
        DEBUGGING: boolean;
        RESTURL: string;
        WSURL: string;
    }

    export interface PublicRequestOptions {
        market?: string;
        symbol?: string;
        depth?: number;
        limit?: number;
        start?: number;
        end?: number;
        tradeIdFrom?: number;
        tradeIdTo?: number;
        interval?: string;
    }

    export interface WebSocketOptions extends PublicRequestOptions {
        action: string;
    }

    export default class Bitvavo {
        constructor();
        getEmitter(): EventEmitter;
        getRemainingLimit(): number;
        time(callback?: Function): any;
        markets(options?: PublicRequestOptions, callback?: Function): any;
        assets(options?: PublicRequestOptions, callback?: Function): any;
        book(symbol?: string, options?: PublicRequestOptions, callback?: Function): any;
        publicTrades(symbol?: string, options?: PublicRequestOptions, callback?: Function): any;
        candles(symbol?: string, interval?: string, options?: PublicRequestOptions, callback?: Function): any;
        tickerPrice(options?: PublicRequestOptions, callback?: Function): any;
        tickerBook(options?: PublicRequestOptions, callback?: Function): any;
        ticker24h(options?: PublicRequestOptions, callback?: Function): any;
        options(options: BitvavoOptions): this;
        websocket: {
            checkSocket(): Promise<void>;
            close(): Promise<void>;
            time(): Promise<void>;
            markets(options?: WebSocketOptions): Promise<void>;
            assets(options?: WebSocketOptions): Promise<void>;
            book(market?: string, options?: WebSocketOptions): Promise<void>;
            publicTrades(market?: string, options?: WebSocketOptions): Promise<void>;
            candles(market?: string, interval?: string, options?: WebSocketOptions): Promise<void>;
            ticker24h(options?: WebSocketOptions): Promise<void>;
            tickerPrice(options?: WebSocketOptions): Promise<void>;
            tickerBook(options?: WebSocketOptions): Promise<void>;
            subscriptionTicker(market?: string, callback?: Function): Promise<void>;
            subscriptionTicker24h(market?: string, callback?: Function): Promise<void>;
            subscriptionCandles(market?: string, interval?: string, callback?: Function): Promise<void>;
            subscriptionTrades(market?: string, callback?: Function): Promise<void>;
            subscriptionBookUpdates(market?: string, callback?: Function): Promise<void>;
            subscriptionBook(market?: string, callback?: Function): Promise<void>;
        };
    }
}