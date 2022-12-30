import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, ColorResolvable } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";

const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
        .setLabel("Top.gg")
        .setStyle(ButtonStyle.Link)
        .setEmoji("<:topgg:990540015853506590>")
        .setURL("https://top.gg/bot/938771676433362955/vote"),
    new ButtonBuilder()
        .setLabel("Discordbotlist.com")
        .setStyle(ButtonStyle.Link)
        .setEmoji("<:dbl:990540323967103036>")
        .setURL("https://discordbotlist.com/bots/coinz/upvote"),
);

export default class extends Command implements ICommand {
    readonly info = {
        name: "vote",
        description: "Get all the links to the voting sites for rewards.",
        options: [],
        category: "misc",
        deferReply: true,
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: CommandInteraction, member: IMember) {
        const votes = member.votes === undefined ? 0 : member.votes;
        const embed = new EmbedBuilder()
            .setTitle("Coinz Vote Links")
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .addFields(
                { name: "Rewards (For each vote)", value: "A free wheel spin. Use </lucky-wheel rewards:1005435550884442193> to see possible rewards.", inline: false },
                { name: "Total Votes", value: `${votes > 0 ? `You have voted ${votes}x in total! Thank you!` : "You haven't voted yet. Please click on the links below to vote."}`, inline: false },
            )
            .setFooter({ text: this.client.config.embed.footer });

        await interaction.editReply({ embeds: [embed], components: [row] });
    }
}