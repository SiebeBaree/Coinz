import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder, User } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember, IPlot } from "../../models/Member";
import Helpers from "../../utils/Helpers";
import Database from "../../utils/Database";

export default class extends Command implements ICommand {
    readonly info = {
        name: "farm",
        description: "Manage your farm and plant crops.",
        options: [
            {
                name: "plots",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Get a list with information about all your plots.",
                options: [],
            },
            {
                name: "plant",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Plant a new crop on your plots.",
                options: [
                    {
                        name: "plot-id",
                        type: ApplicationCommandOptionType.String,
                        description: "The plot ID of where you want to plant. Use , or - to plant on more than one plot.",
                        required: true,
                    },
                    {
                        name: "crop",
                        type: ApplicationCommandOptionType.String,
                        description: "What crop you want to plant. Use \"/shop list\" to check all available crops.",
                        required: true,
                    },
                    {
                        name: "force",
                        type: ApplicationCommandOptionType.String,
                        description: "Do you want to re-plant plots if there is something on the plots? Default = No",
                        required: false,
                        choices: [
                            {
                                name: "Yes",
                                value: "yes",
                            },
                            {
                                name: "No",
                                value: "no",
                            },
                        ],
                    },
                ],
            },
        ],
        category: "business",
    };

    private readonly waterCooldown = 21600;
    private readonly rottenDelay = 172800;

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        switch (interaction.options.getSubcommand()) {
            case "plots":
                await this.getPlots(interaction, member);
                break;
            case "plant":
                await this.getPlant(interaction, member);
                break;
            default:
                await interaction.reply({ content: this.client.config.invalidCommand, ephemeral: true });
        }
    }

    private async getPlots(interaction: ChatInputCommandInteraction, member: IMember) {
        let finishedCommand = false;
        const message = await interaction.reply({ embeds: [await this.getEmbed(interaction.user, member)], components: [this.getButtons(member)], fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: 8, idle: 20_000, time: 90_000, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            if (finishedCommand) return;
            if (i.customId.startsWith("farm_")) {
                // update member to counter abuse
                member = await Database.getMember(interaction.user.id);

                switch (i.customId) {
                    case "farm_harvestAllPlots":
                        await this.pressHarvestButton(member);
                        await interaction.followUp({ content: "Harvested all plots.", ephemeral: true });
                        break;
                    case "farm_waterPlots":
                        await this.pressWaterButton(member);
                        await interaction.followUp({ content: "I've watered the crops and they will now grow 1 hour faster.", ephemeral: true });
                        break;
                    case "farm_buyPlot":
                        if (await this.buyNewPlot(member)) {
                            await interaction.followUp({ content: "You successfully bought a new plot.", ephemeral: true });
                        }
                        break;
                    default:
                        return;
                }

                // get updated member to update embed
                member = await Database.getMember(interaction.user.id);

                await i.update({ embeds: [await this.getEmbed(interaction.user, member)], components: [this.getButtons(member)] });
            }
        });

        collector.on("end", async () => {
            if (!finishedCommand) {
                finishedCommand = true;
                await interaction.editReply({ components: [this.getButtons(member, true)] });
            }
        });
    }

    private async getPlant(interaction: ChatInputCommandInteraction, member: IMember) {
        const plotIds = interaction.options.getString("plot-id", true);
        const cropId = interaction.options.getString("crop", true);
        const force = interaction.options.getString("force") === "yes" ? true : false;

        if (member.plots.length <= 0) {
            await interaction.reply({ content: "You don't have any plots yet. Buy a plot using </farm plots:1048340073470513154>.", ephemeral: true });
            return;
        }

        const plantedPlots = Helpers.parseNumbers(plotIds);

        if (plantedPlots.length <= 0) {
            await interaction.reply({ content: "That is not a valid plot ID. Please enter a number or plant on multiple plots using this syntax:\nUse `,` to select another plot or `-` to select a range of plots.\n__Example:__ `1,3-6,9-11` will plant that crop on plot 1, 3, 4, 5, 6, 9, 10 and 11.", ephemeral: true });
            return;
        } else if (Math.min(...plantedPlots) <= 0 || Math.max(...plantedPlots) > member.plots.length) {
            await interaction.reply({ content: `One or more plot IDs were not in the range of 1-${member.plots.length}.`, ephemeral: true });
            return;
        }

        const crop = this.client.items.getById(cropId) || this.client.items.getByName(cropId);
        if (!crop || crop.category !== "crops") {
            await interaction.reply({ content: "That is not a valid crop. Use </shop list:983096143284174861> to check all available crops.", ephemeral: true });
            return;
        }

        if (!force) {
            const alreadyPlanted = plantedPlots.filter((plotId) => member.plots[plotId - 1].status !== "empty");

            if (alreadyPlanted.length > 0) {
                await interaction.reply({ content: `You already planted something on plot${alreadyPlanted.length > 1 ? "s" : ""} ${alreadyPlanted.join(", ")}.\nUse \`/${this.info.name} plant plot-id: ${plotIds} crop: ${cropId} force: yes\` to re-plant.`, ephemeral: true });
                return;
            }
        }

        const cropInInventory = this.client.items.getInventoryItem(crop.itemId, member);
        if (!cropInInventory || cropInInventory.amount < plantedPlots.length) {
            await interaction.reply({ content: `You don't have enough <:${crop.itemId}:${crop.emoteId}> **${crop.name}** in your inventory.\nUse \`/shop buy item-id: ${crop.itemId} amount: ${plantedPlots.length - (cropInInventory?.amount ?? 0)}\``, ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });
        for (let i = 0; i < plantedPlots.length; i++) {
            await Member.updateOne({ id: interaction.user.id }, {
                [`plots.${plantedPlots[i] - 1}.status`]: "growing",
                [`plots.${plantedPlots[i] - 1}.crop`]: crop.itemId,
                [`plots.${plantedPlots[i] - 1}.harvestOn`]: Math.floor(Date.now() / 1000) + (crop.duration ?? 21600),
            });
        }

        await interaction.editReply({ content: `You successfully planted <:${crop.itemId}:${crop.emoteId}> **${crop.name}** on plot${plantedPlots.length > 1 ? "s" : ""} ${plantedPlots.join(", ")}.` });
    }

    private async getEmbed(user: User, member: IMember): Promise<EmbedBuilder> {
        const plotLimit = member.premium.active ? 15 : 9;
        const now = Math.floor(Date.now() / 1000);

        const waterDescription = member.lastWatered + this.waterCooldown > now ?
            `You can water your crops again in ${Helpers.msToTime((member.lastWatered + this.waterCooldown) * 1000 - Date.now())}.` :
            "You can water your plots.";

        const buyPlotDescription = member.plots.length < plotLimit ? `\n:moneybag: **You can buy a new plot for :coin: ${this.getPlotPrice(member.plots.length)}.**` : "";

        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Farm`)
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(`:seedling: **Use** </${this.info.name} plant:1048340073470513154> **to plant a crop.**\n:droplet: **${waterDescription}**\n:wilted_rose: **You can clear rotten crops by harvesting all plots.**\n:basket: **All harvested crops are found in your inventory** </inventory:983096143179284519>**.**${buyPlotDescription}`);

        if (member.plots.length == 0) {
            embed.addFields({ name: "Buy a Plot", value: "Please press the button below to buy a plot.", inline: false });
            return embed;
        }

        for (let i = 0; i < member.plots.length; i++) {
            const plot = member.plots[i];
            let plotIsChanged = false;
            let icon = ":brown_square:";
            let cropStatus = "No crops planted";

            if (plot.status !== "empty" && plot.status !== "rotten") {
                if (plot.harvestOn + this.rottenDelay < now) {
                    plot.status = "rotten";
                    plotIsChanged = true;
                } else if (plot.harvestOn < now && plot.status !== "harvest") {
                    plot.status = "harvest";
                    plotIsChanged = true;
                }
            }

            if (plot.status === "growing") {
                const item = this.client.items.getById(plot.crop);
                if (!item) continue;

                icon = ":seedling:";
                cropStatus = `<:${item.itemId}:${item.emoteId}> in ${Helpers.msToTime((plot.harvestOn * 1000) - Date.now())}`;
            } else if (plot.status === "rotten") {
                icon = ":wilted_rose:";
                cropStatus = "Crops are rotten";
            } else if (plot.status === "harvest") {
                const item = this.client.items.getById(plot.crop);
                if (!item) continue;

                icon = `<:${item.itemId}:${item.emoteId}>`;
                cropStatus = `<:${item.itemId}:${item.emoteId}> ready to harvest`;
            }

            embed.addFields({ name: `Plot (ID: ${plot.plotId + 1})`, value: `${this.getVisualRow(icon)}\n${cropStatus}`, inline: true });
            if (plotIsChanged) {
                await Member.updateOne({ id: member.id, "plots.plotId": plot.plotId },
                    { $set: { "plots.$.status": plot.status, "plots.$.soilQuality": plot.soilQuality } },
                );
            }
        }

        return embed;
    }

    private getButtons(member: IMember, disabled = false): ActionRowBuilder<ButtonBuilder> {
        const [harvestStatus, waterStatus, buyPlotStatus] = this.getButtonStatus(member);
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("farm_harvestAllPlots")
                .setLabel("Harvest")
                .setStyle(ButtonStyle.Success)
                .setDisabled(harvestStatus || disabled),
            new ButtonBuilder()
                .setCustomId("farm_waterPlots")
                .setLabel("Water")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(waterStatus || disabled),
            new ButtonBuilder()
                .setCustomId("farm_buyPlot")
                .setLabel("Buy New Plot")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(buyPlotStatus || disabled),
        );
    }

    private getButtonStatus(member: IMember): boolean[] {
        return [
            member.plots.filter((plot) => plot.status === "harvest" || plot.status === "rotten").length === 0,
            member.plots.filter((plot) => plot.status === "growing").length === 0 || member.lastWatered + this.waterCooldown > Math.floor(Date.now() / 1000),
            member.plots.length >= (member.premium.active ? 15 : 9) || member.wallet < this.getPlotPrice(member.plots.length),
        ];
    }

    private getPlotPrice(plotNumber: number): number {
        return plotNumber * 2500 + 2500;
    }

    private getVisualRow(icon: string): string {
        return icon.repeat(6);
    }

    private async pressWaterButton(member: IMember): Promise<void> {
        for (let i = 0; i < member.plots.length; i++) {
            if (member.plots[i].status === "growing") {
                await Member.updateOne({ id: member.id, "plots.plotId": member.plots[i].plotId }, { $inc: { "plots.$.harvestOn": -3600 } });
            }
        }

        await Member.updateOne({ id: member.id }, { $set: { lastWater: Math.floor(Date.now() / 1000) } });
    }

    private async pressHarvestButton(member: IMember): Promise<void> {
        const harvestedPlots = member.plots.filter((plot) => plot.status === "harvest");
        const rottenPlots = member.plots.filter((plot) => plot.status === "rotten");

        // reduce the harvested plots to an object with the crop as key and the amount as value
        const items = harvestedPlots.reduce((acc, cur) => {
            const crop = cur.crop.trim().toLowerCase();
            acc[crop] = (acc[crop] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        // add items to the inventory of the member
        for (const [itemId, amount] of Object.entries(items)) {
            await this.client.items.addItem(itemId, member, amount * 6);
        }

        // set the status of all harvested and rottenplots to "empty"
        for (const plot of harvestedPlots.concat(rottenPlots)) {
            await Member.updateOne({ id: member.id, "plots.plotId": plot.plotId }, {
                $set: { "plots.$.status": "empty", "plots.$.crop": "none" },
            });
        }
    }

    private async buyNewPlot(member: IMember): Promise<boolean> {
        if (member.wallet < this.getPlotPrice(member.plots.length)) return false;

        const plotObj: IPlot = {
            plotId: member.plots.length,
            status: "empty",
            harvestOn: 0,
            crop: "none",
            soilQuality: 100,
        };

        await Member.updateOne({ id: member.id }, {
            $push: { plots: plotObj },
            $inc: { wallet: -this.getPlotPrice(member.plots.length) },
        });

        return true;
    }
}