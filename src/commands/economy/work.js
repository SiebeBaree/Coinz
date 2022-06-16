const { MessageActionRow, MessageButton } = require('discord.js');
const workList = require('../../data/jobs/jobs.json').jobs;
const guildUserSchema = require('../../database/schemas/guildUsers');

function getJob(jobName) {
    for (let i = 0; i < workList.length; i++) {
        if (jobName === workList[i].name) return workList[i];
    }
    return null;
}

function setMathRow(buttons, isDisabled = false) {
    let row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("work_btn0")
            .setLabel(buttons[0].name.toString())
            .setStyle(buttons[0].style || "SECONDARY")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("work_btn1")
            .setLabel(buttons[1].name.toString())
            .setStyle(buttons[1].style || "SECONDARY")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("work_btn2")
            .setLabel(buttons[2].name.toString())
            .setStyle(buttons[2].style || "SECONDARY")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("work_btn3")
            .setLabel(buttons[3].name.toString())
            .setStyle(buttons[3].style || "SECONDARY")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("work_btn4")
            .setLabel(buttons[4].name.toString())
            .setStyle(buttons[4].style || "SECONDARY")
            .setDisabled(isDisabled)
    );
    return row;
}

async function mgMath(client, interaction, data) {
    let gameInProgress = true;
    const operators = ["+", "-", "*"]
    const operatorIndex = client.tools.randomNumber(0, operators.length - 1);

    let maxNumber = operators[operatorIndex] === "*" ? 10 : 50;
    let number1 = client.tools.randomNumber(1, maxNumber);
    let number2 = client.tools.randomNumber(0, maxNumber);

    const mathStr = `${number1} ${operators[operatorIndex]} ${number2}`
    const answer = eval(mathStr.replace(/[^-()\d/*+.]/g, ''));

    let buttons = [];

    for (let i = 0; i < 4; i++) {
        let fakeNumber1 = 1;
        let fakeNumber2 = 0;
        let fakeAnswer = `0`;
        do {
            fakeNumber1 = client.tools.randomNumber(1, maxNumber);
            fakeNumber2 = client.tools.randomNumber(0, maxNumber);
            fakeAnswer = eval(`${fakeNumber1}${operators[operatorIndex]}${fakeNumber2}`.replace(/[^-()\d/*+.]/g, ''))
        } while (fakeAnswer == answer);
        buttons.push({ name: fakeAnswer });
    }

    // from https://stackoverflow.com/a/38181008/13712977
    const insert = (arr, index, newItem) => [
        // part of the array before the specified index
        ...arr.slice(0, index),
        // inserted item
        newItem,
        // part of the array after the specified index
        ...arr.slice(index)
    ]

    const correctAnswerIndex = client.tools.randomNumber(0, 3);
    buttons = insert(buttons, correctAnswerIndex, { name: answer })

    await interaction.editReply({ content: `What is the result of \`${mathStr}\`?`, components: [setMathRow(buttons)] });
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, time: 10000 });

    collector.on('collect', async (interactionCollector) => {
        if (gameInProgress) {
            gameInProgress = false;
            let selectedPage;
            if (interactionCollector.customId.startsWith('work_btn')) selectedPage = interactionCollector.customId.charAt(interactionCollector.customId.length - 1);
            await interactionCollector.deferUpdate();

            if (buttons[selectedPage].name != answer) {
                buttons[selectedPage].style = "DANGER";

                await interaction.followUp({ content: `That is not the correct answer. You did not earn anything this hour.` })

                if (data.hasBusiness) {
                    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
                        $set: { "business.workSalary": Math.ceil(data.salary * 0.9) }
                    });
                }
            } else {
                await client.tools.addMoney(interaction.guildId, interaction.member.id, data.salary);
                await interaction.followUp({ content: `GG! You are very good at math. You earned :coin: ${data.salary} this hour.` })
            }

            buttons[correctAnswerIndex].style = "SUCCESS";
            await interaction.editReply({ components: [setMathRow(buttons, true)] });
        }
    })

    collector.on('end', async (interactionCollector) => {
        if (gameInProgress) {
            gameInProgress = false;

            if (data.hasBusiness) {
                await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
                    $set: { "business.workSalary": Math.ceil(data.salary * 0.9) }
                });
            }

            buttons[correctAnswerIndex].style = "DANGER";
            await interaction.followUp({ content: `You were too slow to pick the correct answer. You didn't earn anything.` })
            await interaction.editReply({ components: [setMathRow(buttons, true)] });
        }
    })
}

module.exports.execute = async (client, interaction, data) => {
    if (data.guildUser.job == "" || data.guildUser.job == null) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, "work");
        return interaction.reply({ content: `You don't have a job. Please find a job using \`/job list\`.`, ephemeral: true });
    }

    let salary = 0;
    data.hasBusiness = false;
    if (data.guildUser.job === "business") {
        salary = data.guildUser.business.workSalary;
        data.hasBusiness = true;
    } else {
        const job = getJob(data.guildUser.job);
        if (job == null) {
            await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
                $set: { job: "" }
            });
            await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, "work");
            return interaction.reply({ content: `Something went wrong. Please try again.`, ephemeral: true });
        }

        salary = job.salary;
    }
    data.salary = salary;
    await interaction.deferReply();
    await mgMath(client, interaction, data);
}

module.exports.help = {
    name: "work",
    description: "Work hard and get paid a unfair salary.",
    options: [],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 3600,
    enabled: true
}