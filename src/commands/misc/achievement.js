const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const idAchievements = require('../../assets/achievements.json');
const MemberModel = require('../../models/Member');

class Achievement extends Command {
    info = {
        name: "achievement",
        description: "Refresh or view your current achievements.",
        options: [
            {
                name: 'list',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get a list with all achievements.',
                options: []
            },
            {
                name: 'refresh',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Scan for new achievements you might have received.',
                options: []
            },
            {
                name: 'select',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Select an achievement to display on your profile.',
                options: [
                    {
                        name: 'achievement',
                        type: ApplicationCommandOptionType.String,
                        description: 'The achievement you want to select.',
                        required: true
                    }
                ]
            }
        ],
        category: "misc",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: true,
        deferReply: true
    };

    itemsPerPage = 7;

    achievements = {
        "hard_work": {
            name: "Work Hard, Become Rich",
            description: "Complete your work 50 times.",
            isValid: (memberData, statsData) => {
                return statsData.workComplete >= 50;
            },
            progress: (memberData, statsData) => {
                return `${statsData.workComplete || 0}/50`;
            }
        },
        "patron": {
            name: "A Real Patron",
            description: "Buy Coinz Premium.",
            isValid: (memberData, statsData) => {
                return false;
            },
            progress: (memberData, statsData) => {
                return false;
            }
        },
        "going_places": {
            name: "Going Places",
            description: "Create a company and have 5 employees.",
            isValid: (memberData, statsData) => {
                return false;
            },
            progress: (memberData, statsData) => {
                return false;
            }
        },
        "bug_hunter": {
            name: "Bug Hunter",
            description: "Help find bugs in Coinz.",
            isValid: (memberData, statsData) => {
                return false;
            },
            progress: (memberData, statsData) => {
                return false;
            }
        },
        "farmers_life": {
            name: "Farmer's Life",
            description: "Buy all 15 plots for your farm.",
            isValid: (memberData, statsData) => {
                return memberData.plots.length === 15;
            },
            progress: (memberData, statsData) => {
                return `${memberData.plots.length || 0}/15`;
            }
        },
        "warren_buffet": {
            name: "The New Warren Buffett",
            description: "Invest :coin: 75k or more.",
            isValid: (memberData, statsData) => {
                let totalInvestments = 0;
                for (let i = 0; i < memberData.stocks.length; i++) totalInvestments += memberData.stocks[i].buyPrice;
                return totalInvestments >= 75_000;
            },
            progress: (memberData, statsData) => {
                let totalInvestments = 0;
                for (let i = 0; i < memberData.stocks.length; i++) totalInvestments += memberData.stocks[i].buyPrice;
                return `${totalInvestments || 0}/75,000`;
            }
        },
        "touch_grass": {
            name: "Go touch some grass",
            description: "Execute 500 commands or more.",
            isValid: (memberData, statsData) => {
                return statsData.commandsExecuted >= 500;
            },
            progress: (memberData, statsData) => {
                return `${statsData.commandsExecuted || 0}/500`;
            }
        },
        // "winner": {
        //     name: "Look mom, I won something!",
        //     description: "Get a Trophy.",
        //     isValid: (memberData, statsData) => {
        //         for (let i = 0; i < memberData.inventory.length; i++) if (memberData.inventory[i].itemId === "trophy") return true;
        //         return false;
        //     },
        //     progress: (memberData, statsData) => {
        //         return false;
        //     }
        // },
        "local_fish_dealer": {
            name: "Local Fish Dealer",
            description: "Catch 100 fish.",
            isValid: (memberData, statsData) => {
                return statsData.catchedFish >= 100;
            },
            progress: (memberData, statsData) => {
                return `${statsData.catchedFish || 0}/100`;
            }
        },
        "gold_digger": {
            name: "Gold Digger",
            description: "Find 20 diamonds in total while using </dig:983096143179284516>.",
            isValid: (memberData, statsData) => {
                return statsData.diamondsFound >= 20;
            },
            progress: (memberData, statsData) => {
                return `${statsData.diamondsFound || 0}/20`;
            }
        },
        "keep_on_grinding": {
            name: "Keep on Griding",
            description: "Get a daily streak of 30.",
            isValid: (memberData, statsData) => {
                return memberData.streak >= 30;
            },
            progress: (memberData, statsData) => {
                return `${memberData.streak || 0}/30`;
            }
        },
        "feeling_lucky": {
            name: "Feeling Lucky",
            description: "Spin the lucky wheel 50 times.",
            isValid: (memberData, statsData) => {
                return memberData.votes - memberData.spins >= 50;
            },
            progress: (memberData, statsData) => {
                return `${memberData.votes - memberData.spins || 0}/50`;
            }
        },
        "easy_blackjack": {
            name: "Easy Blackjack!",
            description: "Reach 21 in blackjack as soon as the dealer deals the cards.",
            isValid: (memberData, statsData) => {
                return false;
            },
            progress: (memberData, statsData) => {
                return false;
            }
        },
        "collection": {
            name: "A Small Collection",
            description: "Have more than 1,000 items in your inventory.",
            isValid: (memberData, statsData) => {
                let quantity = 0;
                for (let i = 0; i < memberData.inventory.length; i++) quantity += memberData.inventory[i].quantity;
                return quantity >= 1_000;
            },
            progress: (memberData, statsData) => {
                let quantity = 0;
                for (let i = 0; i < memberData.inventory.length; i++) quantity += memberData.inventory[i].quantity;
                return `${quantity || 0}/1,000`;
            }
        }
    }

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (interaction.options.getSubcommand() === "list") return await this.execList(interaction, data);
        if (interaction.options.getSubcommand() === "refresh") return await this.execRefresh(interaction, data);
        if (interaction.options.getSubcommand() === "select") return await this.execSelect(interaction, data);
        return await interaction.editReply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${this.info.name}\`.` });
    }

    async execList(interaction, data) {
        const createList = (keys, items, currentPage, memberData, statsData) => {
            let str = "";

            for (let i = 0; i < keys.length; i++) {
                if (i >= currentPage * this.itemsPerPage && i < currentPage * this.itemsPerPage + this.itemsPerPage) {
                    let progressStr = "";
                    let alreadyAchieved = "";
                    let progress = items[keys[i]].progress(memberData, statsData);

                    if (!data.user.badges.includes(keys[i])) {
                        if (progress !== false) progressStr = ` (${progress})`;
                    } else {
                        alreadyAchieved = "~~";
                    }

                    str += `<:${keys[i]}:${idAchievements[keys[i]]}> ${alreadyAchieved}**${items[keys[i]].name}**${alreadyAchieved}${progressStr}\n> ${items[keys[i]].description}\n\n`
                }
            }

            return str;
        }

        const createEmbed = (desc, currentPage, maxPages) => {
            if (desc.trim() === "") desc = "I found 0 achievements...";
            let embed = new EmbedBuilder()
                .setTitle("Achievement List")
                .setColor(bot.config.embed.color)
                .setFooter({ text: `/${this.info.name} refresh to get new achievements. ─ Page ${currentPage + 1} of ${maxPages}.` })
                .setDescription(desc)
            return embed;
        }

        const keys = Object.keys(this.achievements);
        const maxPages = Math.ceil(keys.length / this.itemsPerPage);
        let currentPage = 0;

        const stats = await bot.database.fetchStats(interaction.member.id);
        let achievementStr = createList(keys, this.achievements, currentPage, data.user, stats);
        const interactionMessage = await interaction.editReply({ embeds: [createEmbed(achievementStr, currentPage, maxPages)], components: [bot.tools.pageButtons(currentPage, maxPages)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: 10, idle: 15000, time: 60000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();
            if (interactionCollector.customId === 'toLastPage') currentPage = maxPages - 1;
            else if (interactionCollector.customId === 'toFirstPage') currentPage = 0;
            else if (interactionCollector.customId === 'toNextPage') currentPage++;
            else if (interactionCollector.customId === 'toPreviousPage') currentPage--;

            achievementStr = createList(keys, this.achievements, currentPage, data.user, stats);
            await interaction.editReply({ embeds: [createEmbed(achievementStr, currentPage, maxPages)], components: [bot.tools.pageButtons(currentPage, maxPages)] });
        });

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [bot.tools.pageButtons(currentPage, maxPages, true)] });
        });
    }

    async execRefresh(interaction, data) {
        if (data.user.badges === undefined) data.user.badges = [];
        const keys = Object.keys(this.achievements);
        const stats = await bot.database.fetchStats(interaction.member.id);

        let newBadgesStr = "";
        for (let i = 0; i < keys.length; i++) {
            if (data.user.badges.includes(keys[i])) continue;
            const achievement = this.achievements[keys[i]];

            if (achievement.isValid(data.user, stats)) {
                await MemberModel.updateOne({ id: interaction.member.id }, { $push: { badges: keys[i] } });
                newBadgesStr += `<:${keys[i]}:${idAchievements[keys[i]]}> ${achievement.name}\n> ${achievement.description}\n\n`;
            }
        }

        if (newBadgesStr === "") return await interaction.editReply({ content: `You didn't get any new achievements.` });

        const embed = new EmbedBuilder()
            .setTitle("You got new achievements")
            .setColor(bot.config.embed.color)
            .setDescription(newBadgesStr)

        await interaction.editReply({ embeds: [embed] });
    }

    async execSelect(interaction, data) {
        const achievementName = interaction.options.getString('achievement').toLowerCase();
        if (data.user.badges === undefined) data.user.badges = [];

        let achievement = this.achievements[achievementName] === undefined ? undefined : achievementName;
        if (achievement === undefined) {
            const keys = Object.keys(this.achievements);
            for (let i = 0; i < keys.length; i++) {
                if (this.achievements[keys[i]].name.toLowerCase() === achievementName && data.user.badges.includes(keys[i])) {
                    achievement = keys[i];
                    break;
                }
            }
        }

        if (achievement === undefined) return await interaction.editReply({ content: `You don't have this achievement. Please give the correct name. (Case Insensitive)` });
        await MemberModel.updateOne({ id: interaction.member.id }, { $set: { displayedBadge: achievement } });
        await interaction.editReply({ content: `You selected <:${achievement}:${idAchievements[achievement]}> as your badge on your profile.` });
    }
}

module.exports = Achievement;