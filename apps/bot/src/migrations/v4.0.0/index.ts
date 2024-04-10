/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */
// @ts-nocheck
import process from 'node:process';
import { connect } from 'mongoose';
import UserStats from '../../models/userStats';
import logger from '../../utils/logger';
import Member from '../../models/member';
import data from './data.json';
import Achievement from '../../lib/achievement';
import itemData from '../../data/items.json';
import type { Item } from '../../models/item';
import { InventoryItem } from 'src/lib/types';

const oldMembers = data as any;
let count = 0;
const achievement = new Achievement();
const items = new Map<string, Item>(itemData.map((item: Item) => [item.itemId, item]));
let promises = [];

(async () => {
    logger.info('Connecting to the database...');
    await connect(process.env.DATABASE_URI!);

    logger.info('Starting migration...');
    const timestampMigrationStart = Date.now();
    for (const member of oldMembers) {
        count += 1;

        if (count % 100 === 0) {
            logger.info(`Migrating member #${count}...`);
        }

        if (member.version === 1) {
            logger.info(`Member (${member.id}) #${count} already migrated.`);
        } else {
            member.wallet += (member.tickets ?? 0) * 500;

            for (const badge of member.badges as string[]) {
                if (!achievement.getById(badge)) {
                    member.badges = member.badges.filter((b: string) => b !== badge);
                }
            }

            const inventory = member.inventory
                .map((item: any) => ({
                    itemId: item.itemId,
                    amount: item.amount,
                }))
                .filter((item: InventoryItem) => items.has(item.itemId)) as InventoryItem[];

            const investments = member.stocks.map((investment: any) => ({
                ticker: investment.ticker,
                amount: investment.amount.$numberDecimal,
                buyPrice: investment.buyPrice,
            }));

            const plots = member.plots.map((plot: any) => ({
                plotId: plot.plotId,
                status: plot.status,
                harvestOn: plot.harvestOn,
                crop: plot.crop,
                soilQuality: plot.soilQuality,
            }));

            const newMember = new Member({
                id: member.id,
                banned: false,
                votes: member.votes ?? 0,
                spins: member.spins ?? 0,
                wallet: member.wallet ?? 0,
                bank: member.bank ?? 0,
                bankLimit: member.bankLimit ?? 7_500,
                experience: member.experience ?? 0,
                job: member.job ?? '',
                streak: member.streak ?? 0,
                lastStreak: new Date(member.lastStreak.$date ?? 0),
                passiveMode: member.passiveMode ?? false,
                inventory: inventory ?? [],
                investments: investments ?? [],
                plots: plots ?? [],
                lastWatered: member.lastWatered ?? 0,
                profileColor: '',
                displayedBadge: member.displayedBadge ?? '',
                birthday: new Date((typeof member.birthday.$date === 'object' ? 0 : member.birthday.$date) ?? 0),
                country: '',
                badges: member.badges ?? [],
                tree: {
                    height: member.tree.height ?? 0,
                    plantedAt: member.tree.planted ?? 0,
                    timesWatered: member.tree.timesWatered ?? 0,
                    wateredAt: member.tree.lastWatered ?? 0,
                    nextEventAt: member.tree.nextEvent ?? 0,
                    isCuttingDown: 0,
                    extraHeight: 0,
                },
                premium: 0,
                notifications: member.notifications ?? ['vote'],
                version: 1,
            });

            const userStats = new UserStats({
                id: member.id,
                dailyActivity: {
                    startDay:
                        (member.stats.commandsExecuted ?? 0) > 250
                            ? new Date(member.createdAt.$date ?? Date.now())
                            : new Date(),
                    totalCommands: member.stats.commandsExecuted ?? 0,
                },
                luckyWheelSpins: member.stats.luckyWheelSpins ?? 0,
                timesWorked: member.stats.timesWorked ?? 0,
                fishCaught: member.stats.fishCaught ?? 0,
                timesRobbed: member.stats.timesRobbed ?? 0,
                timesPlotHarvested: member.stats.timesHarvested ?? 0,
                timesPlotWatered: member.stats.timesWatered ?? 0,
            });

            promises.push(newMember.save());
            promises.push(userStats.save());
        }
    }

    logger.info(
        `Migrating finished in ${Date.now() - timestampMigrationStart}ms. Waiting for all promises to resolve...`,
    );

    Promise.all(promises).then(() => {
        logger.info(`Migration finished in ${Date.now() - timestampMigrationStart}ms.`);
        process.exit(0);
    });
})();
