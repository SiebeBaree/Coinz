import { Schema, model } from 'mongoose';

type IMessage = {
    userId: string;
    content: string;
    attachments: string[];
    createdAt: Date;
    updatedAt: Date;
};

type IUser = {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    bot: boolean;
};

export type ITicket = {
    initialMessageId: string;
    channelId: string;
    userId: string;
    status: string;
    claimedBy: string;
    closedBy: string;
    deletedBy: string;
    ticketNumber: number;
    rating: number;
    responseMessageId: string;
    createdAt: Date;
    updatedAt: Date;
    messages: IMessage[];
    users: IUser[];
};

const Message = new Schema<IMessage>(
    {
        userId: { type: String, required: true },
        content: { type: String, required: true },
        attachments: [{ type: String, default: [] }],
    },
    { timestamps: true },
);

const User = new Schema<IUser>({
    id: { type: String, required: true },
    username: { type: String, required: true },
    displayName: { type: String, default: '' },
    avatar: { type: String, required: true },
    bot: { type: Boolean, default: false },
});

const ticket = new Schema<ITicket>(
    {
        initialMessageId: { type: String, required: false },
        channelId: { type: String, required: true, index: true, unique: true },
        userId: { type: String, required: true, index: true },
        status: { type: String, required: true },
        claimedBy: { type: String, required: false },
        closedBy: { type: String, required: false },
        deletedBy: { type: String, required: false },
        rating: { type: Number, default: 0 },
        responseMessageId: { type: String, required: false },
        ticketNumber: { type: Number, required: true },
        messages: [{ type: Message, default: [] }],
        users: [{ type: User, default: [] }],
    },
    { timestamps: true },
);

export default model<ITicket>('Ticket', ticket);
