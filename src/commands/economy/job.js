const { MessageEmbed } = require('discord.js');
const workList = require('../../data/jobs/jobs.json').jobs;
const guildUserSchema = require('../../database/schemas/guildUsers');

const itemsPerPage = 5;
const maxPages = Math.ceil(workList.length / itemsPerPage);

function getJob(jobName) {
    jobName = jobName.toLowerCase();
    for (let i = 0; i < workList.length; i++) {
        if (jobName === workList[i].name.toLowerCase()) return workList[i];
    }
    return null;
}

function getListEmbed(client, jobs, userData, currentPage) {
    const embed = new MessageEmbed()
        .setTitle('Work')
        .setColor(client.config.embed.color)
        .setFooter({ text: `/shop list [item-id] to get more info about an item. ─ Page ${currentPage + 1} of ${maxPages}.` })

    let currentJob = ``;
    if (userData.job != "") currentJob = `:briefcase: **You are currently working as a ${userData.job}.**\n`;
    if (userData.job.startsWith("business")) currentJob = `:briefcase: **You work at a company. Leave your company using \`/company info\`\n`;
    let descField = `${currentJob}:moneybag: **To apply for a job use** \`/job apply <job>\`**.**\n:o: **You can only apply for jobs with** :white_check_mark:\n:mans_shoe: **Leave a job by using** \`/job leave\`**.**\n\n`;
    for (let job in jobs) {
        let icon = ':x:';
        if (client.calc.getLevel(userData.experience) >= jobs[job].minLvl) icon = ':white_check_mark:';
        descField += `${icon} **${jobs[job].name}** ― :coin: ${jobs[job].salary} / hour\n> Required hours per day: \`${jobs[job].minWorkPerDay}\` ― Minimum Level: \`${jobs[job].minLvl}\`\n\n`;
    }
    embed.setDescription(descField);
    return embed;
}

function getJobs(currentPage) {
    let jobs = [];
    for (let i = 0; i < workList.length; i++) {
        if (i >= currentPage * itemsPerPage && i < currentPage * itemsPerPage + itemsPerPage) {
            jobs.push(workList[i]);
        }
    }
    return jobs;
}

async function execList(client, interaction, data) {
    let currentPage = 0;
    await interaction.reply({ embeds: [getListEmbed(client, getJobs(currentPage), data.guildUser, currentPage)], components: [client.tools.setListButtons(currentPage, maxPages)] });
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, max: 20, idle: 15000, time: 60000 });

    collector.on('collect', async (interactionCollector) => {
        if (interactionCollector.customId === 'toLastPage') currentPage = maxPages - 1;
        else if (interactionCollector.customId === 'toFirstPage') currentPage = 0;
        else if (interactionCollector.customId === 'toNextPage') currentPage++;
        else if (interactionCollector.customId === 'toPreviousPage') currentPage--;
        await interactionCollector.deferUpdate();
        await interaction.editReply({ embeds: [getListEmbed(client, getJobs(currentPage), data.guildUser, currentPage)], components: [client.tools.setListButtons(currentPage, maxPages)] });
    })

    collector.on('end', async (interactionCollector) => {
        await interaction.editReply({ components: [client.tools.setListButtons(currentPage, maxPages, true)] });
    })
}

async function execLeave(client, interaction, data) {
    if (data.guildUser.job === "business") return await interaction.reply({ content: `You have a business. You can't quit your business.\nYou can sell your business using \`/business sell\`.`, ephemeral: true });
    const job = getJob(data.guildUser.job);
    if (job === null) return await interaction.reply({ content: `You don't have a job. Please apply for a job with \`/job apply <job>\`.`, ephemeral: true });

    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
        $set: { job: "" }
    });

    await interaction.reply({ content: `You successfully left your job (\`${job.name}\`).`, ephemeral: true });
}

async function execApply(client, interaction, data) {
    if (data.guildUser.job === "business") return await interaction.reply({ content: `You cannot apply for a normal job when you have a business.`, ephemeral: true });
    const currentJob = getJob(data.guildUser.job);
    if (currentJob !== null) return await interaction.reply({ content: `You already have a job. Please leave your current job with \`/job leave\`.`, ephemeral: true });

    const job = getJob(interaction.options.getString('job-name'));
    if (job === null) return await interaction.reply({ content: `That is not a valid job. Please use \`/job list\` to view all jobs.`, ephemeral: true });
    if (job.minLvl > client.calc.getLevel(data.guildUser.experience)) return interaction.reply({ content: `Your level is too low to apply for this job.`, ephemeral: true });

    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
        $set: { job: job.name }
    });

    await interaction.reply({ content: `GG, you got the job (\`${job.name}\`).`, ephemeral: true });
}

module.exports.execute = async (client, interaction, data) => {
    if (interaction.options.getSubcommand() === "list") return await execList(client, interaction, data);
    if (interaction.options.getSubcommand() === "leave") return await execLeave(client, interaction, data);
    if (interaction.options.getSubcommand() === "apply") return await execApply(client, interaction, data);
    return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${data.cmd.help.name}\`.`, ephemeral: true });
}

module.exports.help = {
    name: "job",
    description: "Apply for a job or get a list with all jobs.",
    options: [
        {
            name: 'list',
            type: 'SUB_COMMAND',
            description: 'Get a list with all jobs.',
            options: []
        },
        {
            name: 'leave',
            type: 'SUB_COMMAND',
            description: 'Leave your current job.',
            options: []
        },
        {
            name: 'apply',
            type: 'SUB_COMMAND',
            description: 'Apply for a job.',
            options: [
                {
                    name: 'job-name',
                    type: 'STRING',
                    description: 'The plot ID of where you want to plant.',
                    required: true
                }
            ]
        }
    ],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}