const Command = require('../../structures/Command.js');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const workList = require('../../assets/jobList.json').jobs;
const wordList = require('../../assets/wordlist.json').words;
const MemberModel = require('../../models/Member');
const CompanyModel = require('../../models/Company');

class Work extends Command {
    info = {
        name: "work",
        description: "Work hard and get paid a unfair salary.",
        options: [],
        category: "economy",
        extraFields: [],
        cooldown: 1800,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (data.user.job == "" || data.user.job == null) {
            await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            return await interaction.reply({ content: `You don't have a job. Please find a job using \`/job list\`.`, ephemeral: true });
        }
        await interaction.deferReply();

        data.hasBusiness = false;
        data.gameInProgress = true;
        if (data.user.job.startsWith("business")) {
            data = await bot.tools.hasCompany(interaction.member.id, data);
            data.salary = data.employee.wage;
            data.hasBusiness = true;

            if (data.employee.wage > data.company.balance) return await interaction.editReply({ content: `Your company hasn't enough money to pay you. Please produce items in the factories.` });
        } else {
            const job = this.getJob(data.user.job);
            if (job == null) {
                await MemberModel.updateOne({ id: interaction.member.id }, { $set: { job: "" } });
                await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
                return await interaction.editReply({ content: `You don't have a valid job... Please apply for a LEGAL job next time. You can't work if you dont have a LEGAL job.` });
            }

            data.salary = job.salary;
        }

        const minigames = ["mgRememberWord", "mgMath", "mgOrder"];
        await eval(`this.${minigames[bot.tools.randomNumber(0, minigames.length - 1)]}(interaction, data)`);
    }

    async mgMath(interaction, data) {
        const operators = ["+", "-", "*"];
        const operatorIndex = bot.tools.randomNumber(0, operators.length - 1);

        let maxNumber = operators[operatorIndex] === "*" ? 10 : 50;
        let number1 = bot.tools.randomNumber(1, maxNumber);
        let number2 = bot.tools.randomNumber(0, maxNumber);

        const mathStr = `${number1} ${operators[operatorIndex]} ${number2}`;
        data.answer = eval(mathStr.replace(/[^-()\d/*+.]/g, ''));

        let buttons = [];
        for (let i = 0; i < 4; i++) {
            let fakeNumber1 = 1;
            let fakeNumber2 = 0;
            let fakeAnswer = `0`;
            do {
                fakeNumber1 = bot.tools.randomNumber(1, maxNumber);
                fakeNumber2 = bot.tools.randomNumber(0, maxNumber);
                fakeAnswer = eval(`${fakeNumber1}${operators[operatorIndex]}${fakeNumber2}`.replace(/[^-()\d/*+.]/g, ''));
            } while (fakeAnswer == data.answer);
            buttons.push({ name: fakeAnswer });
        }

        const insert = (arr, index, newItem) => [...arr.slice(0, index), newItem, ...arr.slice(index)];
        data.correctAnswerIndex = bot.tools.randomNumber(0, 3);
        buttons = insert(buttons, data.correctAnswerIndex, { name: data.answer });

        const interactionMessage = await interaction.editReply({ content: `What is the result of \`${mathStr}\`?`, components: [this.setButtonsRow(buttons)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { time: 10000 });
        await this.collectorOnCollect(collector, interaction, data, buttons, `GG! You are very good at math. You earned :coin: ${data.salary} this hour.`, `You were too slow to pick the correct answer. You didn't earn anything.`);
    }

    async mgRememberWord(interaction, data) {
        data.answer = wordList[bot.tools.randomNumber(0, wordList.length - 1)];

        let buttons = [];
        for (let i = 0; i < 5; i++) {
            let wordIndex;
            do {
                wordIndex = bot.tools.randomNumber(0, wordList.length - 1);
            } while (buttons.includes(wordList[wordIndex]) || wordList[wordIndex] === data.answer);

            buttons.push({ name: wordList[wordIndex] });
        }
        data.correctAnswerIndex = bot.tools.randomNumber(0, buttons.length - 1);
        buttons[data.correctAnswerIndex] = { name: data.answer };

        await interaction.editReply({ content: `Remember this word: \`${data.answer}\`` });
        await bot.tools.timeout(3000);
        const interactionMessage = await interaction.editReply({ content: `What was the word?`, components: [this.setButtonsRow(buttons)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { time: 10000 });
        await this.collectorOnCollect(collector, interaction, data, buttons, `GG! You are very good at remembering words. You earned :coin: ${data.salary} this hour.`, `You were too slow to pick the correct answer. You didn't earn anything.`);
    }

    async mgOrder(interaction, data) {
        data.currentButton = 0;

        let buttons = [];
        let buttonNames = [];

        for (let i = 0; i < 5; i++) {
            let buttonName;
            do {
                buttonName = bot.tools.randomNumber(1, 100);
            } while (buttonNames.includes(buttonName));

            buttonNames.push(buttonName);
            buttons.push({ name: `${buttonName}` });
        }

        buttonNames.sort((a, b) => a - b);
        const interactionMessage = await interaction.editReply({ content: `Press the buttons in the correct order from low to high!`, components: [this.setButtonsRow(buttons)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: 6, time: 10000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            if (data.gameInProgress) {
                let selectedPage;
                if (interactionCollector.customId.startsWith('work_btn')) selectedPage = interactionCollector.customId.charAt(interactionCollector.customId.length - 1);

                if (parseInt(buttons[selectedPage].name) != buttonNames[data.currentButton]) {
                    data.gameInProgress = false;
                    buttons[selectedPage].style = ButtonStyle.Danger;

                    await interaction.editReply({ components: [this.setButtonsRow(buttons, true)] });
                    await interaction.followUp({ content: `That is not the correct answer. You did not earn anything this hour.` })
                    if (data.hasBusiness) await CompanyModel.updateOne({ id: data.company.ownerId }, { $inc: { balance: -data.salary } });
                } else {
                    data.currentButton++;
                    buttons[selectedPage].style = ButtonStyle.Success;

                    if (data.currentButton === buttons.length) {
                        data.gameInProgress = false;
                        await bot.tools.addMoney(interaction.member.id, data.salary);
                        await interaction.editReply({ components: [this.setButtonsRow(buttons, true)] });
                        return await interaction.followUp({ content: `GG! You ordered these buttons correctly and earned :coin: ${data.salary} this hour.` })
                    }

                    await interaction.editReply({ components: [this.setButtonsRow(buttons)] });
                }
            }
        });

        collector.on('end', async (interactionCollector) => {
            if (data.gameInProgress) {
                data.gameInProgress = false;
                await interaction.editReply({ components: [this.setButtonsRow(buttons, true)] });
                await interaction.followUp({ content: `You were too slow to order the buttons in the correct order. You didn't earn anything this hour.` })
            }
        });
    }

    async collectorOnCollect(collector, interaction, data, buttons, winMsg, loseMsg) {
        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            if (data.gameInProgress) {
                data.gameInProgress = false;
                let selectedPage;
                if (interactionCollector.customId.startsWith('work_btn')) selectedPage = interactionCollector.customId.charAt(interactionCollector.customId.length - 1);

                if (buttons[selectedPage].name != data.answer) {
                    buttons[selectedPage].style = ButtonStyle.Danger;

                    await interaction.followUp({ content: `That is not the correct answer. You did not earn anything this hour.` })
                    if (data.hasBusiness) await CompanyModel.updateOne({ id: data.company.ownerId }, { $inc: { balance: -data.salary } });
                } else {
                    await bot.tools.addMoney(interaction.member.id, data.salary);
                    await interaction.followUp({ content: winMsg })
                }

                buttons[data.correctAnswerIndex].style = ButtonStyle.Success;
                await interaction.editReply({ components: [this.setButtonsRow(buttons, true)] });
            }
        });

        collector.on('end', async (interactionCollector) => {
            if (data.gameInProgress) {
                data.gameInProgress = false;
                buttons[data.correctAnswerIndex].style = ButtonStyle.Danger;
                await interaction.followUp({ content: loseMsg })
                await interaction.editReply({ components: [this.setButtonsRow(buttons, true)] });
            }
        });
    }

    getJob(jobName) {
        for (let i = 0; i < workList.length; i++) {
            if (jobName === workList[i].name) return workList[i];
        }
        return null;
    }

    setButtonsRow(buttons, isDisabled = false) {
        let row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("work_btn0")
                .setLabel(buttons[0].name.toString())
                .setStyle(buttons[0].style || ButtonStyle.Secondary)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("work_btn1")
                .setLabel(buttons[1].name.toString())
                .setStyle(buttons[1].style || ButtonStyle.Secondary)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("work_btn2")
                .setLabel(buttons[2].name.toString())
                .setStyle(buttons[2].style || ButtonStyle.Secondary)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("work_btn3")
                .setLabel(buttons[3].name.toString())
                .setStyle(buttons[3].style || ButtonStyle.Secondary)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("work_btn4")
                .setLabel(buttons[4].name.toString())
                .setStyle(buttons[4].style || ButtonStyle.Secondary)
                .setDisabled(isDisabled)
        );
        return row;
    }
}

module.exports = Work;