import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Bot from "../../../structs/Bot";
import ICommand from "../../../interfaces/ICommand";
import Command from "../../../structs/Command";
import { IMember } from "../../../models/Member";
import Work from "./Work";
import List from "./List";
import Quit from "./Quit";
import Apply from "./Apply";

export default class extends Command implements ICommand {
    readonly info = {
        name: "job",
        description: "Get a job to pay for the bills.",
        options: [
            {
                name: "work",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Work an hour to earn money.",
                options: [],
            },
            {
                name: "list",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Get a list with all jobs.",
                options: [],
            },
            {
                name: "quit",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Quit your current job.",
                options: [],
            },
            {
                name: "apply",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Apply for a job.",
                options: [
                    {
                        name: "job-name",
                        type: ApplicationCommandOptionType.String,
                        description: "The name of the job you want to apply for.",
                        required: true,
                        min_length: 3,
                        max_length: 30,
                    },
                ],
            },
        ],
        category: "general",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        switch (interaction.options.getSubcommand()) {
            case "work":
                await new Work(this.client, this.info).execute(interaction, member);
                break;
            case "list":
                await new List(this.client, this.info).execute(interaction, member);
                break;
            case "quit":
                await new Quit(this.client, this.info).execute(interaction, member);
                break;
            case "apply":
                await new Apply(this.client, this.info).execute(interaction, member);
                break;
            default:
                await interaction.reply({ content: this.client.config.invalidCommand, ephemeral: true });
        }
    }
}