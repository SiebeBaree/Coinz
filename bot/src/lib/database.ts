import type { IBusiness } from '../models/Business';
import Business from '../models/Business';
import type { IMember } from '../models/Member';
import Member from '../models/Member';

export async function getMember(memberId: string, fetch = false): Promise<IMember> {
    let member = await Member.findOne({ id: memberId });
    if (!member) member = new Member({ id: memberId });
    if (fetch) await member.save();
    return member;
}

export async function getBusiness(name: string, fetch = false): Promise<IBusiness> {
    let business = await Business.findOne({ name: name });
    if (!business) business = new Business({ name: name });
    if (fetch) await business.save();
    return business;
}
