import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Bot from "../../../structs/Bot";
import ICommand from "../../../interfaces/ICommand";
import Command from "../../../structs/Command";
import { IMember } from "../../../models/Member";
import User, { BusinessData } from "../../../utils/User";
import View from "./View";
import SetProduction from "./SetProduction";
import ListProducts from "./ListProducts";

export interface FactoryData extends BusinessData {
    items: {
        itemId: string;
        emoteId: string;
        name: string;
        sellPrice: number;
        quantity: number;
        produceTime: number;
        requiredItems: {
            itemId: string;
            amount: number;
        }[];
    }[];
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "factory",
        description: "Create products from your supply and sell them for profit!",
        options: [
            {
                name: "view",
                type: ApplicationCommandOptionType.Subcommand,
                description: "View all your factories and their status.",
                options: [],
            },
            {
                name: "set-production",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Produce items from a factory.",
                options: [
                    {
                        name: "factory-id",
                        type: ApplicationCommandOptionType.String,
                        description: "The factory you want to make items in. Use , or - to produce in more than one factory.",
                        required: true,
                    },
                    {
                        name: "product-id",
                        type: ApplicationCommandOptionType.String,
                        description: "The product you want to produce.",
                        required: true,
                    },
                    {
                        name: "force",
                        type: ApplicationCommandOptionType.String,
                        description: "Do you want to override the production in a factory? Default = No",
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
            {
                name: "list-products",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Get a list of all the items your factories can produce.",
                options: [],
            },
        ],
        category: "business",
    };

    private readonly productionItems: FactoryData["items"] = [];
    private readonly products = {
        "soccer_ball": {},
        "shirt": {
            "cloth": 1,
        },
        "earbuds": {
            "plastic": 1,
        },
        "processor": {
            "silicon": 1,
        },
        "graphics_card": {
            "processor": 1,
            "plastic": 1,
        },
        "desktop": {
            "processor": 1,
            "graphics_card": 1,
        },
        "server": {
            "desktop": 2,
        },
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);

        for (const [itemId, requiredItems] of Object.entries(this.products)) {
            const item = this.client.items.getById(itemId);
            if (!item) continue;

            this.productionItems.push({
                itemId,
                emoteId: item.emoteId,
                name: item.name,
                sellPrice: item.sellPrice ?? 0,
                quantity: Math.floor(item.multiplier ?? 1),
                produceTime: item.duration ?? 3600,
                requiredItems: Object.entries(requiredItems).map(([_itemId, amount]) => ({
                    itemId: _itemId,
                    amount,
                })),
            });
        }
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const data = {
            ...await User.getBusiness(member),
            items: this.productionItems,
        };

        switch (interaction.options.getSubcommand()) {
            case "view":
                new View(this.client, this.file, this.info).execute(interaction, member, data);
                break;
            case "set-production":
                new SetProduction(this.client, this.file, this.info).execute(interaction, member, data);
                break;
            case "list-products":
                new ListProducts(this.client, this.file, this.info, data).execute(interaction);
                break;
            default:
                await interaction.reply({ content: this.client.config.invalidCommand, ephemeral: true });
        }
    }
}