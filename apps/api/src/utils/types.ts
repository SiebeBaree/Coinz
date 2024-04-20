export type TopGGWebhook = {
    bot: string;
    user: string;
    type: 'upvote' | 'test';
    isWeekend: boolean;
    query?: string;
};

export type DBLWebhook = {
    admin: boolean;
    avatar: string;
    username: string;
    id: string;
};
