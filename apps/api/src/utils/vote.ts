import { Website } from './enums';
import Member from '../schemas/member';

type VoteResponse = {
    success: boolean;
    website: Website;
    totalVotes: number;
    nextReminder?: number;
    sendMessage: boolean;
};

export async function processVote(userId: string, website: Website): Promise<VoteResponse> {
    const member = await Member.findOne({ id: userId });
    if (!member) {
        return {
            success: false,
            website,
            totalVotes: 0,
            sendMessage: false,
        };
    }

    await Member.updateOne({ id: userId }, { $inc: { votes: 1, spins: member.premium === 2 ? 2 : 1 } });
    return {
        success: true,
        website,
        totalVotes: member.votes + 1,
        sendMessage: member.notifications.includes('vote'),
    };
}
