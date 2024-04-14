import process from 'node:process';
import { connect } from 'mongoose';
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import itemData from '../../data/items.json';
import Achievement from '../../lib/achievement';
import type { InventoryItem } from '../../lib/types';
import { Positions } from '../../lib/types';
import Business, { type IEmployee } from '../../models/business';
import type { Item } from '../../models/item';
import Member from '../../models/member';
import UserStats from '../../models/userStats';
import { generateRandomString } from '../../utils';
import BusinessItems from '../../utils/business';
import logger from '../../utils/logger';
import savedBusinesses from './businesses.json';
import savedMembers from './members.json';

const oldMembers = savedMembers as any;
const oldBusinesses = savedBusinesses as any;
const achievement = new Achievement();
const items = new Map<string, Item>(itemData.map((item: Item) => [item.itemId, item]));
const businessItems = new BusinessItems();
const promises = [];

async function checkBusinessName(name: string): Promise<string> {
    name = name.trim();

    if (name.length > 24) {
        throw new Error('You can only use a maximum of 24 characters for your business name.');
    } else if (!/^[A-Za-z][\w -.]*$/.test(name)) {
        throw new Error(
            'Your business name can only use `A-Z, a-z, 0-9, whitespaces, -, _, .` and you have to start with a letter.',
        );
    }

    const matcher = new RegExpMatcher({
        ...englishDataset.build(),
        ...englishRecommendedTransformers,
    });

    if (matcher.hasMatch(name)) {
        throw new Error('Your business name contains inappropriate language.');
    }

    const currentBusiness = await Business.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (currentBusiness) {
        throw new Error(`A business with the name **${name}** already exists.`);
    }

    return name;
}

(async () => {
    logger.info('Connecting to the database...');
    await connect(process.env.DATABASE_URI!);

    logger.info('Starting migration...');
    const timestampMigrationStart = Date.now();
    let memberCount = 0;
    for (const member of oldMembers) {
        memberCount += 1;

        if (memberCount % 100 === 0) {
            logger.info(`Migrating member #${memberCount}...`);
        }

        if (member.version === 1) {
            logger.info(`Member (${member.id}) #${memberCount} already migrated.`);
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

            const investments = [];
            for (const investment of member.stocks) {
                if (
                    Number.parseFloat(investment.amount.$numberDecimal) < 0.00001 ||
                    !investment.amount?.$numberDecimal
                ) {
                    continue;
                }

                investments.push({
                    ticker: investment.ticker,
                    amount: investment.amount.$numberDecimal,
                    buyPrice: investment.buyPrice,
                });
            }

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

    logger.info('Migrating businesses...');

    let businessCount = 0;
    for (const business of oldBusinesses) {
        businessCount += 1;

        if (businessCount % 10 === 0) {
            logger.info(`Migrating business #${businessCount}...`);
        }

        let businessName: string;
        try {
            businessName = await checkBusinessName(business.name);
        } catch (error: unknown) {
            logger.error(`Error migrating business #${businessCount}: ${business.name}\n${(error as Error).message}`);
            continue;
        }

        if (businessName.length < 1) {
            logger.error(
                `Error migrating business #${businessCount}: Business name is empty. (Original: ${business.name})`,
            );
            continue;
        }

        const employees: IEmployee[] = [];
        for (const employee of business.employees) {
            let position = Positions.Employee;
            if (
                employee.position === 'manager' ||
                employee.position === 'operations_officer' ||
                employee.position === 'executive'
            ) {
                position = Positions.Manager;
            } else if (employee.position === 'ceo') {
                position = Positions.CEO;
            }

            let employeeId: string;
            do {
                employeeId = generateRandomString(6);
            } while (employees.some((e) => e.employeeId === employeeId));

            employees.push({
                employeeId: employeeId,
                userId: employee.userId,
                position: position as number,
                hiredOn: employee.hiredOn,
                moneyEarned: employee.moneyEarned,
            });
        }

        const factories = [];
        for (const factory of business.factories) {
            let produceOn = factory.produceOn;
            if (typeof factory.produceOn === 'object') {
                produceOn = Math.round(Number.parseInt(factory.produceOn.$numberLong, 10) / 1000);
            }

            factories.push({
                factoryId: factory.factoryId,
                level: 0,
                production: factory.production,
                status: factory.status,
                produceOn: produceOn,
            });
        }

        const inventory = business.inventory
            .map((item: any) => ({
                itemId: item.itemId,
                amount: item.amount,
            }))
            .filter((item: InventoryItem) => businessItems.items.has(item.itemId)) as InventoryItem[];

        const newBusiness = new Business({
            name: businessName,
            balance: business.balance,
            taxRate: 5,
            employees: employees,
            inventory: inventory,
            factories: factories,
        });
        await newBusiness.save();
    }

    logger.info(
        `Setup migration finished in ${Date.now() - timestampMigrationStart}ms. Waiting for all promises to resolve...`,
    );

    await Promise.all(promises);
    logger.info(`Migration finished in ${Date.now() - timestampMigrationStart}ms.`);
    process.exit(0);
})();
