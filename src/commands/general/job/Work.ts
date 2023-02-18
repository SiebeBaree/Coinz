import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, Message } from "discord.js";
import { Info } from "../../../interfaces/ICommand";
import Member, { IMember } from "../../../models/Member";
import Bot from "../../../structs/Bot";
import jobs from "../../../assets/jobs.json";
import Helpers from "../../../utils/Helpers";
import User from "../../../utils/User";
import words from "../../../assets/words.json";
import Cooldown from "../../../utils/Cooldown";
import Achievement from "../../../utils/Achievement";

interface IButton {
    label: number | string;
    style: ButtonStyle,
    disabled?: boolean;
}

export default class {
    private readonly client: Bot;
    private readonly info: Info;
    private readonly achievement;

    constructor(client: Bot, info: Info) {
        this.client = client;
        this.info = info;
        this.achievement = Achievement.getById("hard_work");
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        if (member.job === "" || member.job === "Unemployed") {
            await interaction.reply({ content: "You don't have a job. Apply for a job using </job apply:983096143284174858>.", ephemeral: true });
            return;
        }

        const job = jobs.find((j) => j.name === member.job);
        if (!job) {
            await interaction.reply({ content: "You don't have a valid job. Apply for a job using </job apply:983096143284174858>.", ephemeral: true });
            return;
        }

        const cooldown = await Cooldown.getRemainingCooldown(interaction.user.id, "job.work");
        if (cooldown > 0) {
            await interaction.reply({ content: `:x: You have to wait ${Helpers.msToTime(cooldown * 1000)} to work again.`, ephemeral: true });
            return;
        }
        await Cooldown.setCooldown(interaction.user.id, "job.work", 3600);

        await interaction.deferReply();
        const minigame = Helpers.getRandomNumber(0, 2);

        switch (minigame) {
            case 1:
                await this.workOrder(interaction, member, job);
                break;
            case 2:
                await this.workRememberWord(interaction, member, job);
                break;
            default:
                await this.workMath(interaction, member, job);
                break;
        }
    }

    private async workMath(interaction: ChatInputCommandInteraction, member: IMember, job: typeof jobs[0]) {
        const operators = ["+", "-", "*"];
        const operator = operators[Helpers.getRandomNumber(0, operators.length - 1)];

        const maxNumber = operator === "*" ? 20 : 100;
        const num1 = Helpers.getRandomNumber(1, maxNumber);
        const num2 = Helpers.getRandomNumber(0, maxNumber);

        const mathStr = `${num1} ${operator} ${num2}`;
        const answer = eval(mathStr.replace(/[^-()\d/*+.]/g, ""));

        const options: IButton[] = [];

        for (let i = 0; i < 5; i++) {
            let num: number;

            do {
                num = Helpers.getRandomNumber(answer - 7, answer + 7);
            } while (num === answer || options.some((o) => o.label === num));

            options.push({
                label: num,
                style: ButtonStyle.Secondary,
            });
        }

        const correctIndex = Helpers.getRandomNumber(0, options.length - 1);
        options[correctIndex].label = answer;

        const message = await interaction.editReply({ content: `What is the result of \`${mathStr}\`?`, components: [this.setButtonsRow(options)] });
        await this.collector(interaction, member, job, message, options, correctIndex);
    }

    private async workRememberWord(interaction: ChatInputCommandInteraction, member: IMember, job: typeof jobs[0]) {
        const answer = words[Helpers.getRandomNumber(0, words.length - 1)];

        const options: IButton[] = [];

        for (let i = 0; i < 5; i++) {
            let word: string;

            do {
                word = words[Helpers.getRandomNumber(0, words.length - 1)];
            } while (word === answer || options.some((o) => o.label === word));

            options.push({
                label: word,
                style: ButtonStyle.Secondary,
            });
        }

        const correctIndex = Helpers.getRandomNumber(0, options.length - 1);
        options[correctIndex].label = answer;

        await interaction.editReply({ content: `Remember the word below. You have 3 seconds.\n> \`${answer}\`` });
        await Helpers.getTimeout(3000);

        const message = await interaction.editReply({ content: "What was the word?", components: [this.setButtonsRow(options)] });
        await this.collector(interaction, member, job, message, options, correctIndex);
    }

    private async workOrder(interaction: ChatInputCommandInteraction, member: IMember, job: typeof jobs[0]) {
        const options: IButton[] = [];

        for (let i = 0; i < 5; i++) {
            let num: number;

            do {
                num = Helpers.getRandomNumber(1, 100);
            } while (options.some((o) => o.label === num));

            options.push({
                label: num,
                style: ButtonStyle.Secondary,
            });
        }

        const message = await interaction.editReply({ content: "Press the buttons in the correct order from low to high!", components: [this.setButtonsRow(options)] });
        const collector = message.createMessageComponentCollector({
            filter: (buttonInteraction) => buttonInteraction.user.id === interaction.user.id,
            time: 12_000, componentType: ComponentType.Button, max: 5,
        });

        let finishedCommand = false;
        let currentButton = 0;
        const sortedArray = [...options].sort((a, b) => <number>a.label - <number>b.label);

        collector.on("collect", async (i) => {
            if (finishedCommand) return;

            const buttonIndex = parseInt(i.customId.charAt(i.customId.length - 1));
            if (sortedArray[currentButton].label !== options[buttonIndex].label) {
                finishedCommand = true;
                options[buttonIndex].style = ButtonStyle.Danger;

                await i.update({ components: [this.setButtonsRow(options, true)] });
                await interaction.followUp({ content: "You pressed the wrong button." });
                collector.stop();
            } else {
                currentButton++;
                options[buttonIndex].style = ButtonStyle.Success;

                if (currentButton === options.length) {
                    finishedCommand = true;

                    await i.deferUpdate();
                    const exp = await User.addExperience(interaction.user.id);
                    await interaction.followUp({ content: `Correct answer! You earned :coin: ${job.salary} and gained ${exp} experience.` });
                    await Member.updateOne({ id: interaction.user.id }, { $inc: { wallet: job.salary, "stats.timesWorked": 1 } });
                    await User.sendAchievementMessage(interaction, interaction.user.id, this.achievement);
                    collector.stop();
                }

                if (i.deferred) {
                    await interaction.editReply({ components: [this.setButtonsRow(options, finishedCommand)] });
                } else {
                    await i.update({ components: [this.setButtonsRow(options, finishedCommand)] });
                }
            }
        });

        collector.on("end", async () => {
            if (!finishedCommand) {
                await interaction.followUp({ content: "You took too long to answer." });
                await interaction.editReply({ components: [this.setButtonsRow(options, true)] });
                return;
            }
        });
    }

    private async collector(interaction: ChatInputCommandInteraction, member: IMember, job: typeof jobs[0], message: Message, options: IButton[], correctIndex: number) {
        const collector = message.createMessageComponentCollector({
            filter: (buttonInteraction) => buttonInteraction.user.id === interaction.user.id,
            time: 10_000, componentType: ComponentType.Button, max: 1,
        });

        let finishedCommand = false;
        collector.on("collect", async (i) => {
            if (!i.customId.startsWith("work_option") || finishedCommand) return;
            finishedCommand = true;

            const buttonIndex = parseInt(i.customId.charAt(i.customId.length - 1));
            options[correctIndex].style = ButtonStyle.Success;

            await i.deferUpdate();
            if (buttonIndex === correctIndex) {
                const exp = await User.addExperience(interaction.user.id);
                await interaction.followUp({ content: `Correct answer! You earned :coin: ${job.salary} and gained ${exp} experience.` });
                await Member.updateOne({ id: interaction.user.id }, { $inc: { wallet: job.salary, "stats.timesWorked": 1 } });
                await User.sendAchievementMessage(interaction, interaction.user.id, this.achievement);
            } else {
                options[buttonIndex].style = ButtonStyle.Danger;
                await interaction.followUp({ content: "Wrong answer. You won't get paid for this hour." });
            }

            await interaction.editReply({ components: [this.setButtonsRow(options, true)] });
        });

        collector.on("end", async () => {
            if (!finishedCommand) {
                options[correctIndex].style = ButtonStyle.Success;
                await interaction.followUp({ content: "You took too long to answer." });
                await interaction.editReply({ components: [this.setButtonsRow(options, true)] });
                return;
            }
        });
    }

    private setButtonsRow(buttons: IButton[], isDisabled = false): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            buttons.map((button, index) => new ButtonBuilder()
                .setCustomId(`work_option${index}`)
                .setLabel(button.label.toString())
                .setStyle(button.style)
                .setDisabled(button.disabled ?? isDisabled),
            ),
        );
    }
}