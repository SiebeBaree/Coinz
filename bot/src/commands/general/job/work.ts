import type { ChatInputCommandInteraction, Message } from 'discord.js';
import { ButtonStyle, ActionRowBuilder, ButtonBuilder, ComponentType } from 'discord.js';
import jobs from '../../../data/jobs.json';
import words from '../../../data/words.json';
import type Bot from '../../../domain/Bot';
import type { Job } from '../../../lib/types';
import type { IMember } from '../../../models/member';
import UserStats from '../../../models/userStats';
import { filter, getRandomNumber, msToTime, wait } from '../../../utils';
import { addExperience, addMoney } from '../../../utils/money';

type Button = {
    label: number | string;
    style: ButtonStyle;
    disabled?: boolean;
};

export default async function jobWork(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    if (member.job === '') {
        await interaction.reply({
            content: "You don't have a job. Apply for a job using `/job apply <job-name>`.",
            ephemeral: true,
        });
        return;
    }

    const job = jobs.find((j) => j.name === member.job);
    if (!job) {
        await interaction.reply({
            content: "You don't have a valid job. Apply for a job using `/job apply <job-name>`.",
            ephemeral: true,
        });
        return;
    }

    const cooldown = await client.cooldown.getCooldown(interaction.user.id, 'job.work');
    if (cooldown) {
        await interaction.reply({
            content: `:x: You have to wait ${msToTime(
                Math.abs(Number.parseInt(cooldown, 10) - Math.floor(Date.now() / 1_000)) * 1_000,
            )} to work again.`,
            ephemeral: true,
        });
        return;
    }

    await interaction.deferReply();
    await client.cooldown.setCooldown(interaction.user.id, 'job.work', 3600);

    switch (getRandomNumber(0, 2)) {
        case 1:
            await workOrder(client, interaction, member, job);
            break;
        case 2:
            await workRememberWord(client, interaction, member, job);
            break;
        default:
            await workMath(client, interaction, member, job);
            break;
    }
}

async function workOrder(client: Bot, interaction: ChatInputCommandInteraction, member: IMember, job: Job) {
    const options: Button[] = [];

    for (let i = 0; i < 5; i++) {
        let num: number;

        do {
            num = getRandomNumber(1, 100);
        } while (options.some((o) => o.label === num));

        options.push({
            label: num,
            style: ButtonStyle.Secondary,
        });
    }

    const message = await interaction.editReply({
        content: 'Press the buttons in the correct order from low to high!',
        components: [setButtonsRow(options)],
    });
    const collector = message.createMessageComponentCollector({
        filter: async (i) => filter(interaction, i),
        time: 12_000,
        componentType: ComponentType.Button,
        max: 5,
    });

    let finishedCommand = false;
    let currentButton = 0;
    const sortedArray = [...options].sort((a, b) => (a.label as number) - (b.label as number));

    collector.on('collect', async (i) => {
        if (finishedCommand) return;

        const buttonIndex = Number.parseInt(i.customId.charAt(i.customId.length - 1), 10);
        if (sortedArray[currentButton]!.label === options[buttonIndex]!.label) {
            currentButton++;
            options[buttonIndex]!.style = ButtonStyle.Success;

            if (currentButton === options.length) {
                finishedCommand = true;

                await i.deferUpdate();
                const exp = await addExperience(member);
                await interaction.followUp({
                    content: `Correct answer! You earned :coin: ${job.salary} and gained ${exp} experience.`,
                });

                await addMoney(interaction.user.id, job.salary);
                await UserStats.updateOne({ id: interaction.user.id }, { $inc: { timesWorked: 1 } }, { upsert: true });

                await client.achievement.sendAchievementMessage(
                    interaction,
                    interaction.user.id,
                    client.achievement.getById('hard_work'),
                );
                collector.stop();
            }

            if (i.deferred) {
                await interaction.editReply({ components: [setButtonsRow(options, finishedCommand)] });
            } else {
                await i.update({ components: [setButtonsRow(options, finishedCommand)] });
            }
        } else {
            finishedCommand = true;
            options[buttonIndex]!.style = ButtonStyle.Danger;

            await i.update({ components: [setButtonsRow(options, true)] });
            await interaction.followUp({ content: 'You pressed the wrong button.' });
            collector.stop();
        }
    });

    collector.on('end', async () => {
        if (!finishedCommand) {
            await interaction.followUp({ content: 'You took too long to answer.' });
            await interaction.editReply({ components: [setButtonsRow(options, true)] });
        }
    });
}

async function workRememberWord(client: Bot, interaction: ChatInputCommandInteraction, member: IMember, job: Job) {
    const answer = words[getRandomNumber(0, words.length - 1)]!;
    const options: Button[] = [];

    for (let i = 0; i < 5; i++) {
        let word: string;

        do {
            word = words[getRandomNumber(0, words.length - 1)]!;
        } while (word === answer || options.some((o) => o.label === word));

        options.push({
            label: word,
            style: ButtonStyle.Secondary,
        });
    }

    const correctIndex = getRandomNumber(0, options.length - 1);
    options[correctIndex]!.label = answer;

    await interaction.editReply({ content: `Remember the word below. You have 3 seconds.\n> \`${answer}\`` });
    await wait(3000);

    const message = await interaction.editReply({
        content: 'What was the word?',
        components: [setButtonsRow(options)],
    });
    await collector(client, interaction, member, job, message, options, correctIndex);
}

async function workMath(client: Bot, interaction: ChatInputCommandInteraction, member: IMember, job: Job) {
    const operators = ['+', '-', '*'];
    const operator = operators[getRandomNumber(0, operators.length - 1)];

    const maxNumber = operator === '*' ? 20 : 100;
    const num1 = getRandomNumber(1, maxNumber);
    const num2 = getRandomNumber(0, maxNumber);

    const mathStr = `${num1} ${operator} ${num2}`;
    // eslint-disable-next-line no-eval
    const answer = eval(mathStr.replace(/[^\d()*+./-]/g, ''));

    const options: Button[] = [];

    for (let i = 0; i < 5; i++) {
        let num: number;

        do {
            num = getRandomNumber(answer - 7, answer + 7);
        } while (num === answer || options.some((o) => o.label === num));

        options.push({
            label: num,
            style: ButtonStyle.Secondary,
        });
    }

    const correctIndex = getRandomNumber(0, options.length - 1);
    options[correctIndex]!.label = answer;

    const message = await interaction.editReply({
        content: `What is the result of \`${mathStr}\`?`,
        components: [setButtonsRow(options)],
    });
    await collector(client, interaction, member, job, message, options, correctIndex);
}

async function collector(
    client: Bot,
    interaction: ChatInputCommandInteraction,
    member: IMember,
    job: (typeof jobs)[0],
    message: Message,
    options: Button[],
    correctIndex: number,
) {
    const collector = message.createMessageComponentCollector({
        filter: async (i) => filter(interaction, i),
        time: 10_000,
        componentType: ComponentType.Button,
        max: 1,
    });

    let finishedCommand = false;
    collector.on('collect', async (i) => {
        if (!i.customId.startsWith('work_option') || finishedCommand) return;
        finishedCommand = true;

        const buttonIndex = Number.parseInt(i.customId.charAt(i.customId.length - 1), 10);
        options[correctIndex]!.style = ButtonStyle.Success;

        await i.deferUpdate();
        if (buttonIndex === correctIndex) {
            const exp = await addExperience(member);
            await interaction.followUp({
                content: `Correct answer! You earned :coin: ${job.salary} and gained ${exp} experience.`,
            });

            await addMoney(interaction.user.id, job.salary);
            await UserStats.updateOne({ id: interaction.user.id }, { $inc: { timesWorked: 1 } }, { upsert: true });

            await client.achievement.sendAchievementMessage(
                interaction,
                interaction.user.id,
                client.achievement.getById('hard_work'),
            );
        } else {
            options[buttonIndex]!.style = ButtonStyle.Danger;
            await interaction.followUp({ content: "Wrong answer. You won't get paid for this hour." });
        }

        await interaction.editReply({ components: [setButtonsRow(options, true)] });
    });

    collector.on('end', async () => {
        if (!finishedCommand) {
            options[correctIndex]!.style = ButtonStyle.Success;
            await interaction.followUp({ content: 'You took too long to answer.' });
            await interaction.editReply({ components: [setButtonsRow(options, true)] });
        }
    });
}

function setButtonsRow(buttons: Button[], isDisabled = false): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttons.map((button, index) =>
            new ButtonBuilder()
                .setCustomId(`work_option${index}`)
                .setLabel(button.label.toString())
                .setStyle(button.style)
                .setDisabled(button.disabled ?? isDisabled),
        ),
    );
}
