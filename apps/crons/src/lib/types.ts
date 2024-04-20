export type BotListing = {
    name: string;
    api: string;
    method?: string;
    body?: {
        [key: string]: string;
    };
    headers?: {
        [key: string]: string;
    };
};
