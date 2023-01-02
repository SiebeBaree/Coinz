import { ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { readFileSync } from "fs";
import Helpers from "../../utils/Helpers";
import { version } from "discord.js";

export default class extends Command implements ICommand {
    readonly info = {
        name: "info",
        description: "Get some information about Coinz.",
        options: [],
        category: "misc",
        deferReply: true,
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction) {
        const stats = JSON.parse(readFileSync("./src/assets/stats.json").toString());

        const embed = new EmbedBuilder()
            .setAuthor({ name: "Bot Statistics", iconURL: `${this.client.user?.avatarURL() || this.client.config.embed.icon}` })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setFooter({ text: this.client.config.embed.footer })
            .setTimestamp()
            .setDescription("**If you like this bot, maybe consider buying [Coinz Premium](https://coinzbot.xyz/store).**")
            .addFields(
                { name: "Info", value: `:man_technologist: **Owner:** \`Siebe#0001\`\n:globe_with_meridians: **Website: [coinzbot.xyz](${this.client.config.website})**\n:beginner: **Official Server: [discord.gg/asnZQwc6kW](https://discord.gg/asnZQwc6kW)**\n:books: **Library:** \`discord.js ${version}\``, inline: true },
                { name: "Statistics", value: `:video_game: **Commands:** \`${this.client.commands.size}\`\n:spider_web: **Shard:** \`${(interaction.guild?.shardId ?? 0) + 1}/${this.client.cluster?.info.TOTAL_SHARDS}\`\n:white_check_mark: **Uptime:** \`${Helpers.msToTime(this.client.uptime ?? 0)}\`\n:bust_in_silhouette: **Users:** \`${stats.members}\`\n:printer: **Servers:** \`${stats.guilds}\``, inline: true },
                { name: "Disclaimer", value: "Icons from the shop are from [icons8](https://icons8.com).", inline: false },
            );
        await interaction.editReply({ embeds: [embed] });
    }
}