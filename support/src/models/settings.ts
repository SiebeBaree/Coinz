import { Schema, model } from 'mongoose';

export type ISettings = {
    welcomeChannel: string;
    modLogChannel: string;
    logChannel: string;
    ticketCreateChannel: string;
    ticketCategory: string;
};

const settings = new Schema<ISettings>(
    {
        welcomeChannel: { type: String, default: '' },
        modLogChannel: { type: String, default: '' },
        logChannel: { type: String, default: '' },
        ticketCreateChannel: { type: String, default: '' },
        ticketCategory: { type: String, default: '' },
    },
    { timestamps: true },
);

export default model<ISettings>('Settings', settings);
