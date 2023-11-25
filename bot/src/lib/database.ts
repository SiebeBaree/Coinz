import Business, { IBusiness } from "../models/Business";
import Guild, { IGuild } from "../models/Guild";
import Member, { IMember } from "../models/Member";
import UserStats, { IUserStats } from "../models/UserStats";

export default class Database {
  static async getGuild(guildId: string, fetch = false): Promise<IGuild> {
    let guild = await Guild.findOne({ id: guildId });
    if (!guild) guild = new Guild({ id: guildId });
    if (fetch) await guild.save();
    return guild;
  }

  static async getMember(memberId: string, fetch = false): Promise<IMember> {
    let member = await Member.findOne({ id: memberId });
    if (!member) member = new Member({ id: memberId });
    if (fetch) await member.save();
    return member;
  }

  static async getBusiness(name: string, fetch = false): Promise<IBusiness> {
    let business = await Business.findOne({ name: name });
    if (!business) business = new Business({ name: name });
    if (fetch) await business.save();
    return business;
  }

  static async getUserStats(memberId: string, fetch = false): Promise<IUserStats> {
    let userStats = await UserStats.findOne({ id: memberId });
    if (!userStats) userStats = new UserStats({ id: memberId });
    if (fetch) await userStats.save();
    return userStats;
  }
}