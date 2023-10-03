import Business, { IBusiness } from "../models/Business";
import Guild, { IGuild } from "../models/Guild";
import Member, { IMember } from "../models/Member";

export default class Database {
    static async getGuild(guildId: string, fetch = false): Promise<IGuild> {
        const guild = await Guild.findOne({ id: guildId });
        if (guild) return guild;

        const newGuild = new Guild({ id: guildId });
        if (fetch) await newGuild.save();
        return newGuild;
    }

    static async getMember(memberId: string, fetch = false): Promise<IMember> {
        const member = await Member.findOne({ id: memberId });
        if (member) return member;

        const newMember = new Member({ id: memberId });
        if (fetch) await newMember.save();
        return newMember;
    }

    static async getBusiness(name: string, fetch = false): Promise<IBusiness> {
        const business = await Business.findOne({ name: name });
        if (business) return business;

        const newBusiness = new Business({ name: name });
        if (fetch) await newBusiness.save();
        return newBusiness;
    }
}