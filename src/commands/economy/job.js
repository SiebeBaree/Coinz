const Command = require('../../structures/Command.js');
const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const workList = require('../../assets/jobList.json').jobs;
const MemberModel = require('../../models/Member');

const itemsPerPage = 5;
const maxPages = Math.ceil(workList.length / itemsPerPage);

class Job extends Command {
    info = {
        name: "job",
        description: "Apply for a job or get a list with all jobs.",
        options: [
            {
                name: 'list',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get a list with all jobs.',
                options: []
            },
            {
                name: 'leave',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Leave your current job.',
                options: []
            },
            {
                name: 'apply',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Apply for a job.',
                options: [
                    {
                        name: 'job-name',
                        type: ApplicationCommandOptionType.String,
                        description: 'The plot ID of where you want to plant.',
                        required: true,
                        min_length: 3,
                        max_length: 30
                    }
                ]
            }
        ],
        category: "economy",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 0,
        enabled: true,
        guildRequired: false,
        memberRequired: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (interaction.options.getSubcommand() === "list") return await this.execList(interaction, data);
        if (interaction.options.getSubcommand() === "leave") return await this.execLeave(interaction, data);
        if (interaction.options.getSubcommand() === "apply") return await this.execApply(interaction, data);
        return await interaction.editReply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${this.info.name}\`.` });
    }

    async execList(interaction, data) {
        let currentPage = 0;
        const interactionMessage = await interaction.editReply({ embeds: [this.getListEmbed(this.getJobs(currentPage), data.user, currentPage)], components: [bot.tools.pageButtons(currentPage, maxPages)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: 15, idle: 15_000, time: 60_000 });

        collector.on('collect', async (interactionCollector) => {
            if (interactionCollector.customId === 'toLastPage') currentPage = maxPages - 1;
            else if (interactionCollector.customId === 'toFirstPage') currentPage = 0;
            else if (interactionCollector.customId === 'toNextPage') currentPage++;
            else if (interactionCollector.customId === 'toPreviousPage') currentPage--;
            await interactionCollector.deferUpdate();
            await interaction.editReply({ embeds: [this.getListEmbed(this.getJobs(currentPage), data.user, currentPage)], components: [bot.tools.pageButtons(currentPage, maxPages)] });
        })

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [bot.tools.pageButtons(currentPage, maxPages, true)] });
        })
    }

    async execLeave(interaction, data) {
        if (data.user.job.startsWith("business")) return await interaction.editReply({ content: `You work at a company. Please leave or sell your company using \`/company info\`` });
        const job = this.getJob(data.user.job);
        if (job === null) return await interaction.editReply({ content: `You don't have a job. Please apply for a job with \`/${this.info.name} apply <job>\`.` });

        await MemberModel.updateOne({ id: interaction.member.id }, {
            $set: { job: "" }
        });

        await interaction.editReply({ content: `You successfully left your job (\`${job.name}\`).` });
    }

    async execApply(interaction, data) {
        if (data.user.job.startsWith("business")) return await interaction.editReply({ content: `You cannot apply for a normal job when you work at a company.` });
        const currentJob = this.getJob(data.user.job);
        if (currentJob !== null) return await interaction.editReply({ content: `You already have a job. Please leave your current job with \`/${this.info.name} leave\`.` });

        const job = this.getJob(interaction.options.getString('job-name'));
        if (job === null) return await interaction.editReply({ content: `That is not a valid job. Please use \`/${this.info.name} list\` to view all jobs.` });

        await MemberModel.updateOne({ id: interaction.member.id }, {
            $set: { job: job.name }
        });

        await interaction.editReply({ content: `GG, you got the job (\`${job.name}\`).` });
    }

    getJob(jobName) {
        jobName = jobName.toLowerCase();
        for (let i = 0; i < workList.length; i++) {
            if (jobName === workList[i].name.toLowerCase()) return workList[i];
        }
        return null;
    }

    getListEmbed(jobs, userData, currentPage) {
        const embed = new EmbedBuilder()
            .setTitle('Job List')
            .setColor(bot.config.embed.color)
            .setFooter({ text: `/${this.info.name} apply [job-name] to apply for a job. ─ Page ${currentPage + 1} of ${maxPages}.` })

        let currentJob = ``;
        if (userData.job != "") currentJob = `:briefcase: **You are currently working as a ${userData.job}.**\n`;
        if (userData.job.startsWith("business")) currentJob = `:briefcase: **You work at a company. Leave your company using \`/company info\`**\n`;
        let descField = `${currentJob}:moneybag: **To apply for a job use** \`/${this.info.name} apply <job>\`**.**\n:o: **You can only apply for jobs with** :white_check_mark:\n:mans_shoe: **Leave a job by using** \`/${this.info.name} leave\`**.**\n\n`;
        for (let job in jobs) {
            descField += `:white_check_mark: **${jobs[job].name}** ― :coin: ${jobs[job].salary} / hour\n> Required hours per day: \`${jobs[job].minWorkPerDay}\`\n\n`;
        }
        embed.setDescription(descField);
        return embed;
    }

    getJobs(currentPage) {
        let jobs = [];
        for (let i = 0; i < workList.length; i++) {
            if (i >= currentPage * itemsPerPage && i < currentPage * itemsPerPage + itemsPerPage) {
                jobs.push(workList[i]);
            }
        }
        return jobs;
    }
}

module.exports = Job;