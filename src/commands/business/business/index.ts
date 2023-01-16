import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Bot from "../../../structs/Bot";
import ICommand from "../../../interfaces/ICommand";
import Command from "../../../structs/Command";
import { IMember } from "../../../models/Member";
import User from "../../../utils/User";
import Info from "./Info";
import Create from "./Create";
import Rename from "./Rename";
import SellBusiness from "./SellBusiness";
import SellItem from "./SellItem";
import Supply from "./Supply";
import Employee from "./Employee";
import PayDividends from "./PayDividends";

export default class extends Command implements ICommand {
    readonly info = {
        name: "business",
        description: "Start your own business and earn the big bucks!",
        options: [
            {
                name: "info",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Get an overview of your business.",
                options: [
                    {
                        name: "name",
                        type: ApplicationCommandOptionType.String,
                        description: "The name of the business you want to get info about.",
                        required: false,
                    },
                ],
            },
            {
                name: "create",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Create your own business.",
                options: [
                    {
                        name: "name",
                        type: ApplicationCommandOptionType.String,
                        description: "The name of your business.",
                        required: true,
                    },
                ],
            },
            {
                name: "leave",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Leave your business as an employee.",
                options: [],
            },
            {
                name: "rename",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Change the name of your business for 10 tickets.",
                options: [
                    {
                        name: "name",
                        type: ApplicationCommandOptionType.String,
                        description: "The new name of your business.",
                        required: true,
                    },
                ],
            },
            {
                name: "sell-business",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Sell your business and get the net worth of your business.",
                options: [],
            },
            {
                name: "sell-item",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Sell an item from the inventory of your business.",
                options: [
                    {
                        name: "item-id",
                        type: ApplicationCommandOptionType.String,
                        description: "The item ID of the item you want to sell.",
                        required: true,
                    },
                    {
                        name: "amount",
                        type: ApplicationCommandOptionType.Integer,
                        description: "The amount of items you want to sell.",
                        required: false,
                        min_value: 1,
                        max_value: 200,
                    },
                ],
            },
            {
                name: "pay-dividends",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Pay dividends to your employees.",
                options: [
                    {
                        name: "amount",
                        type: ApplicationCommandOptionType.Integer,
                        description: "The amount of balance you want to pay to your employees.",
                        required: true,
                        min_value: 100,
                        max_value: 5000,
                    },
                ],
            },
            {
                name: "supply",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Buy or steal supplies to use in your factories.",
                options: [
                    {
                        name: "option",
                        type: ApplicationCommandOptionType.String,
                        description: "How do you want to get your supplies?",
                        required: true,
                        choices: [
                            {
                                name: "Buy",
                                value: "buy",
                                focused: true,
                            },
                            {
                                name: "Steal",
                                value: "steal",
                            },
                        ],
                    },
                    {
                        name: "item-id",
                        type: ApplicationCommandOptionType.String,
                        description: "The item you want to buy or steal.",
                        required: true,
                    },
                    {
                        name: "amount",
                        type: ApplicationCommandOptionType.Integer,
                        description: "This only applies when you buy supplies.",
                        required: false,
                        min_value: 1,
                        max_value: 50,
                    },
                ],
            },
            {
                name: "employee",
                type: ApplicationCommandOptionType.SubcommandGroup,
                description: "Do stuff with employees.",
                options: [
                    {
                        name: "hire",
                        type: ApplicationCommandOptionType.Subcommand,
                        description: "Hire an employee.",
                        options: [
                            {
                                name: "user",
                                type: ApplicationCommandOptionType.User,
                                description: "The user you want to hire.",
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "fire",
                        type: ApplicationCommandOptionType.Subcommand,
                        description: "Fire an employee from your business.",
                        options: [
                            {
                                name: "user",
                                type: ApplicationCommandOptionType.User,
                                description: "The user you want to fire from your business.",
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "set-payout",
                        type: ApplicationCommandOptionType.Subcommand,
                        description: "Set the payout of dividends for an employee.",
                        options: [
                            {
                                name: "user",
                                type: ApplicationCommandOptionType.User,
                                description: "The employee you want to change the payout of.",
                                required: true,
                            },
                            {
                                name: "payout",
                                type: ApplicationCommandOptionType.Integer,
                                description: "The payout of that employee.",
                                required: true,
                                min_value: 10,
                                max_value: 100,
                            },
                        ],
                    },
                    {
                        name: "set-position",
                        type: ApplicationCommandOptionType.Subcommand,
                        description: "Give your employee a job title.",
                        options: [
                            {
                                name: "user",
                                type: ApplicationCommandOptionType.User,
                                description: "The employee you want to change the wage of.",
                                required: true,
                            },
                            {
                                name: "position",
                                type: ApplicationCommandOptionType.String,
                                description: "The position of that employee.",
                                required: true,
                                choices: [
                                    {
                                        name: "Employee",
                                        value: "employee",
                                        focused: true,
                                    },
                                    {
                                        name: "Operations Officer",
                                        value: "operations_officer",
                                    },
                                    {
                                        name: "Manager",
                                        value: "manager",
                                    },
                                    {
                                        name: "Executive",
                                        value: "executive",
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
        category: "business",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const data = await User.getBusiness(member);

        if (interaction.options.getSubcommandGroup() === "employee") {
            new Employee(this.client, this.file, this.info).execute(interaction, member, data);
            return;
        }

        switch (interaction.options.getSubcommand()) {
            case "info":
                new Info(this.client, this.file, this.info).execute(interaction, member, data);
                break;
            case "create":
                new Create(this.client, this.file, this.info).execute(interaction, member, data);
                break;
            case "rename":
                new Rename(this.client, this.file, this.info).execute(interaction, member, data);
                break;
            case "sell-business":
                new SellBusiness(this.client, this.file, this.info).execute(interaction, member, data);
                break;
            case "sell-item":
                new SellItem(this.client, this.file, this.info).execute(interaction, member, data);
                break;
            case "supply":
                new Supply(this.client, this.file, this.info).execute(interaction, member, data);
                break;
            case "pay-dividends":
                new PayDividends(this.client, this.file, this.info).execute(interaction, member, data);
                break;
            default:
                await interaction.reply({ content: this.client.config.invalidCommand, ephemeral: true });
        }
    }
}