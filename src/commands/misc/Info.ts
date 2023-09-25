import { ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
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
        const embed = new EmbedBuilder()
            .setAuthor({ name: "Bot Statistics", iconURL: `${this.client.user?.avatarURL() || this.client.config.embed.icon}` })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription("**If you like this bot, maybe consider [donating](https://coinzbot.xyz/donate).**")
            .addFields(
                { name: "Info", value: `:man_technologist: **Owner:** \`siebe_b\`\n:globe_with_meridians: **Website: [coinzbot.xyz](${this.client.config.website})**\n:beginner: **Official Server:** [**Join here**](https://discord.gg/asnZQwc6kW)\n:books: **Library:** \`discord.js ${version}\``, inline: true },
                { name: "Statistics", value: `:video_game: **Commands:** \`${this.client.commands.size}\`\n:spider_web: **Shard:** \`${(interaction.guild?.shardId ?? 0) + 1}/${this.client.cluster?.info.TOTAL_SHARDS}\`\n:white_check_mark: **Uptime:** \`${Helpers.msToTime(this.client.uptime ?? 0)}\``, inline: true },
                { name: "Disclaimer", value: "Icons from the shop are from [icons8](https://icons8.com).", inline: false },
                { name: "Survey", value: "Coinz is 100% free-to-use. If you want to support the bot, please consider filling out this survey about your sporting journey. This survey will take ~5 minutes to fill in.\n\n> :paperclip: [**Survey**](https://forms.gle/XV6fTcr2YqNfzUde9)", inline: false },
            );
        await interaction.editReply({ embeds: [embed] });
    }
}