import { ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../domain/Bot";
import ICommand from "../../domain/ICommand";
import Command from "../../domain/Command";
import { version } from "discord.js";
import Utils from "../../lib/Utils";

export default class extends Command implements ICommand {
    readonly info = {
        name: "info",
        description: "Get some information about Coinz.",
        options: [],
        category: "misc",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction) {
        const now = Date.now();
        const embed = new EmbedBuilder()
            .setAuthor({ name: "Bot Statistics", iconURL: `${this.client.user?.avatarURL() || this.client.config.embed.icon}` })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(`**If you like this bot, consider buying [Coinz Premium](${this.client.config.website}/premium).**`)
            .addFields(
                { name: "Info", value: `:man_technologist: **Developer:** \`siebe_b\`\n:globe_with_meridians: **Website:** [coinzbot.xyz](${this.client.config.website})\n:beginner: **Official Server:** [Join here](${this.client.config.supportServer})\n:books: **Library:** \`discord.js ${version}\``, inline: true },
                { name: "Statistics", value: `:video_game: **Commands:** \`${this.client.commands.size}\`\n:spider_web: **Shard:** \`${(interaction.guild?.shardId ?? 0) + 1}/${this.client.cluster?.info.TOTAL_SHARDS}\`\n:ping_pong: **Ping:** \`${this.client.ws.ping} ms\`\n:speech_balloon: **Responds Time:** \`${now - interaction.createdTimestamp} ms\`\n:white_check_mark: **Uptime:** \`${Utils.msToTime(this.client.uptime ?? 0)}\``, inline: true },
                { name: "Disclaimer", value: "Icons from the shop are from [icons8](https://icons8.com).", inline: false },
            );
        await interaction.reply({ embeds: [embed] });
    }
}