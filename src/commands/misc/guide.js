const Command = require('../../structures/Command.js');
const { EmbedBuilder } = require('discord.js');

class Info extends Command {
    info = {
        name: "guide",
        description: "Get a guide to help you get started with Coinz.",
        options: [],
        category: "misc",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 0,
        enabled: true
    };

    guides = {
        "general": [
            { name: "Topic 1", value: `This is the description of topic 1`, inline: false },
            { name: "Topic 2", value: `This is the description of topic 2`, inline: false },
            { name: "Topic 3", value: `This is the description of topic 3`, inline: false },
            { name: "Topic 4", value: `This is the description of topic 4`, inline: false },
            { name: "Topic 5", value: `This is the description of topic 5`, inline: false }
        ],
        "investing": [
            { name: "Topic 1", value: `This is the description of topic 1`, inline: false },
            { name: "Topic 2", value: `This is the description of topic 2`, inline: false },
            { name: "Topic 3", value: `This is the description of topic 3`, inline: false },
            { name: "Topic 4", value: `This is the description of topic 4`, inline: false },
            { name: "Topic 5", value: `This is the description of topic 5`, inline: false }
        ],
        "plots": [
            { name: "Topic 1", value: `This is the description of topic 1`, inline: false },
            { name: "Topic 2", value: `This is the description of topic 2`, inline: false },
            { name: "Topic 3", value: `This is the description of topic 3`, inline: false },
            { name: "Topic 4", value: `This is the description of topic 4`, inline: false },
            { name: "Topic 5", value: `This is the description of topic 5`, inline: false }
        ],
        "company": [
            { name: "Topic 1", value: `This is the description of topic 1`, inline: false },
            { name: "Topic 2", value: `This is the description of topic 2`, inline: false },
            { name: "Topic 3", value: `This is the description of topic 3`, inline: false },
            { name: "Topic 4", value: `This is the description of topic 4`, inline: false },
            { name: "Topic 5", value: `This is the description of topic 5`, inline: false }
        ],
        "premium": [
            { name: "Topic 1", value: `This is the description of topic 1`, inline: false },
            { name: "Topic 2", value: `This is the description of topic 2`, inline: false },
            { name: "Topic 3", value: `This is the description of topic 3`, inline: false },
            { name: "Topic 4", value: `This is the description of topic 4`, inline: false },
            { name: "Topic 5", value: `This is the description of topic 5`, inline: false }
        ]
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        await interaction.deferReply();
        let defaultLabel = "general";
        const interactionMessage = await interaction.editReply({ embeds: [this.getEmbed(defaultLabel)], components: [bot.tools.createSelectMenu(this.getSelectMenuOptions(), "guide_selectMenu", defaultLabel, false)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: 10, idle: 40_000, time: 90_000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            // for (let i = 0; i < this.selectMenuOptions.length; i++) this.selectMenuOptions[i].default = false;
            defaultLabel = interactionCollector.values[0];
            await interaction.editReply({ embeds: [this.getEmbed(defaultLabel)], components: [bot.tools.createSelectMenu(this.getSelectMenuOptions(), "guide_selectMenu", defaultLabel, false)] });
        });

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [bot.tools.createSelectMenu(this.getSelectMenuOptions(), "guide_selectMenu", defaultLabel, true)] });
        });
    }

    getEmbed(label) {
        const embed = new EmbedBuilder()
            .setTitle("Guide")
            .setColor(bot.config.embed.color)
            .setFooter({ text: bot.config.embed.footer })
            .setDescription(`:question: **If you still have a question please visit our** [**support server**](https://discord.gg/asnZQwc6kW)**!**\n:globe_with_meridians: **Don't forget to check out our** [**website**](${bot.config.website})**!**`)
            .addFields(this.guides[label])
        return embed;
    }

    getSelectMenuOptions() {
        return [
            { label: 'General', value: 'general' },
            { label: 'Investing', value: 'investing' },
            { label: 'Farming / Plots', value: 'plots' },
            { label: 'Companies', value: 'company' },
            { label: 'Premium', value: 'premium' }
        ];
    }
}

module.exports = Info;