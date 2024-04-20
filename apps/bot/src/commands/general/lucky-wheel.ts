import type { ChatInputCommandInteraction, ColorResolvable } from 'discord.js';
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import luckyWheelLoot from '../../data/luckywheel.json';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import type { Loot } from '../../lib/types';
import type { IMember } from '../../models/member';
import Member from '../../models/member';
import UserStats from '../../models/userStats';
import { getRandomItems, getRandomNumber, wait } from '../../utils';

const rewards = new Map<string, number>(Object.entries(luckyWheelLoot));
const itemsPerField = 15;

function getLootTable(client: Bot): string[] {
    const lootTable: string[] = [];
    let lootTableField: string[] = [];

    let count = 0;
    for (const [itemId, quantity] of rewards) {
        const item = client.items.getById(itemId);
        if (!item) continue;

        count++;

        lootTableField.push(client.items.getItemString(item, quantity));
        if (count > itemsPerField) {
            lootTable.push(lootTableField.join('\n'));
            lootTableField = [];
            count = 0;
        }
    }

    if (lootTableField.length > 0) lootTable.push(lootTableField.join('\n'));
    return lootTable;
}

async function getInfo(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const lootTable = getLootTable(client);

    const embed = new EmbedBuilder()
        .setTitle('Lucky Wheel')
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(
            `:gift: **Vote for Coinz using \`/vote\` to get more spins!**\n:warning: **You get 1 free spin per vote and double spins in the weekend.**\n:star: **You have ${
                member.spins
            }x ${
                member.spins === 1 ? 'spin' : 'spins'
            } left**\n:moneybag: **You can also earn between :coin: 50 and :coin: 500 for every spin**`,
        );

    for (const [i, element] of lootTable.entries()) {
        embed.addFields([{ name: `Possible Rewards (${i + 1})`, value: element, inline: true }]);
    }

    await interaction.reply({ embeds: [embed] });
}

async function getSpin(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const amount = interaction.options.getInteger('amount') ?? 1;

    if (member.spins < amount) {
        await interaction.reply({
            content: `:x: **You don't have enough spins to spin ${amount}x times.**\n:star: **You have ${
                member.spins
            }x ${member.spins === 1 ? 'spin' : 'spins'} left**`,
            ephemeral: true,
        });
        return;
    }

    const loadingEmbed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.user.username}'s Lucky Wheel`, iconURL: interaction.user.displayAvatarURL() })
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(':gear: **Spinning the wheel...**')
        .setImage('https://cdn.coinzbot.xyz/games/luckywheel.gif');
    await interaction.reply({ embeds: [loadingEmbed] });
    await wait(3500);

    const loot = getRandomItems(Array.from(rewards.keys()), amount);
    const lootTable: string[] = [];
    let totalPrice = 0;
    let totalValue = 0;
    const itemsToAdd: Loot = {};

    for (const [itemId, quantity] of Object.entries(loot)) {
        const item = client.items.getById(itemId);
        if (!item) continue;

        if (getRandomNumber(1, 100) < 4) {
            for (let i = 0; i < quantity; i++) {
                totalPrice += getRandomNumber(50, 500);
            }

            continue;
        }

        const itemAmount = quantity * (rewards.get(item.itemId) ?? 1);
        lootTable.push(client.items.getItemString(item, itemAmount));
        itemsToAdd[itemId] = (itemsToAdd[itemId] || 0) + itemAmount;
        totalValue += (item.sellPrice ?? 0) * itemAmount;
    }

    const embed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.user.username}'s Lucky Wheel`, iconURL: interaction.user.displayAvatarURL() })
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(
            `:tada: **You spun the lucky wheel ${amount} time${
                amount === 1 ? '' : 's'
            }.**\n:gem: **Your rewards are :coin: ${totalValue} worth.**${
                totalPrice > 0 ? `\n:moneybag: **You also got :coin: ${totalPrice} extra!**` : ''
            }`,
        )
        .addFields([
            {
                name: `Rewards (${amount} spin${amount === 1 ? '' : 's'})`,
                value: lootTable.join('\n') ?? 'No item rewards :(',
                inline: true,
            },
        ]);
    await interaction.editReply({ embeds: [embed] });

    await Member.updateOne(
        { id: interaction.user.id },
        {
            $inc: { spins: -amount, wallet: totalPrice },
        },
    );

    await UserStats.updateOne({ id: interaction.user.id }, { $inc: { luckyWheelSpins: amount } }, { upsert: true });
    await client.achievement.sendAchievementMessage(
        interaction,
        interaction.user.id,
        client.achievement.getById('feeling_lucky'),
    );
}

export default {
    data: {
        name: 'lucky-wheel',
        description: 'Spin the lucky wheel and get awesome rewards.',
        category: 'general',
        options: [
            {
                name: 'info',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get more info about the possible loot or spin prices.',
                options: [],
            },
            {
                name: 'spin',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Spin the lucky wheel!',
                options: [
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'How many spins you want to do at once. | default: 1.',
                        required: false,
                        min_value: 1,
                        max_value: 20,
                    },
                ],
            },
        ],
        usage: ['info', 'spin [amount]'],
    },
    async execute(client, interaction, member) {
        switch (interaction.options.getSubcommand()) {
            case 'info':
                await getInfo(client, interaction, member);
                break;
            case 'spin':
                await getSpin(client, interaction, member);
                break;
            default:
                await interaction.reply({ content: client.config.invalidCommand, ephemeral: true });
        }
    },
} satisfies Command;
