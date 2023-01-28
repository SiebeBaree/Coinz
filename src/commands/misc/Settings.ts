import { ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder, GuildChannelResolvable, GuildMember, PermissionsBitField, TextChannel } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Database from "../../utils/Database";
import Guild, { IGuild } from "../../models/Guild";
import { IMember } from "../../models/Member";

export default class extends Command implements ICommand {
    private readonly dropRateChoices = [
        {
            name: "Every 1-12 hours",
            value: "3600|43200",
        },
        {
            name: "Every 1-8 hours",
            value: "3600|28800",
        },
        {
            name: "Every 1-6 hours",
            value: "3600|21600",
        },
        {
            name: "Every 1-4 hours",
            value: "3600|14400",
        },
    ];

    readonly info = {
        name: "settings",
        description: "Change settings for THIS SERVER.",
        options: [
            {
                name: "airdrop",
                type: ApplicationCommandOptionType.SubcommandGroup,
                description: "Change the airdrop settings.",
                options: [
                    {
                        name: "toggle",
                        type: ApplicationCommandOptionType.Subcommand,
                        description: "Toggle the current airdrop status.",
                        options: [],
                    },
                    {
                        name: "set-channel",
                        type: ApplicationCommandOptionType.Subcommand,
                        description: "Change the current airdrop channel. This is the setup command.",
                        options: [
                            {
                                name: "channel",
                                type: ApplicationCommandOptionType.Channel,
                                description: "The channel you want airdrops in.",
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "set-drop-rate",
                        type: ApplicationCommandOptionType.Subcommand,
                        description: "Change the current airdrop drop rate.",
                        options: [
                            {
                                name: "drop-rate",
                                type: ApplicationCommandOptionType.String,
                                description: "The drop rate you want airdrops to be.",
                                required: true,
                                choices: this.dropRateChoices,
                            },
                        ],
                    },
                ],
            },
        ],
        category: "misc",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember, guild: IGuild) {
        switch (interaction.options.getSubcommandGroup()) {
            case "airdrop":
                switch (interaction.options.getSubcommand()) {
                    case "toggle":
                        await this.airdropToggle(interaction);
                        break;
                    case "set-channel":
                        await this.airdropSetChannel(interaction);
                        break;
                    case "set-drop-rate":
                        await this.airdropSetDropRate(interaction, guild);
                        break;
                    default:
                        await interaction.reply({ content: this.client.config.invalidCommand, ephemeral: true });
                }
                break;
            default:
                await interaction.reply({ content: this.client.config.invalidCommand, ephemeral: true });
        }
    }

    private async airdropToggle(interaction: ChatInputCommandInteraction) {
        if (!this.hasEnoughPermissions(interaction.member as GuildMember)) {
            await interaction.reply({ content: "You need `Manage Channels` or `Administrator` permissions to use this command.", ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });
        const guild = await Database.getGuild(interaction.guildId as string);

        if (guild.airdrop.channel === "") {
            await interaction.editReply({ content: "You need to set a channel to receive airdrops in first. Use </server-settings airdrop set-channel:1048340073470513152> ." });
            return;
        }

        await Guild.updateOne({ id: interaction.guildId as string }, {
            $set: {
                airdrops: {
                    status: !guild.airdrop.status,
                },
            },
        });

        await interaction.editReply({ content: `Airdrops are now ${guild.airdrop.status ? "disabled" : "enabled"} and will drop in <#${guild.airdrop.channel}>.` });
    }

    private async airdropSetChannel(interaction: ChatInputCommandInteraction) {
        if (!this.hasEnoughPermissions(interaction.member as GuildMember)) {
            await interaction.reply({ content: "You need `Manage Channels` or `Administrator` permissions to use this command.", ephemeral: true });
            return;
        }

        const channel = interaction.options.getChannel("channel", true);

        if (channel.type !== ChannelType.GuildText) {
            await interaction.reply({ content: "You can only set a text channel as the airdrop channel.", ephemeral: true });
            return;
        }

        if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages) ||
            !interaction.guild?.members.me?.permissionsIn(channel as GuildChannelResolvable).has(PermissionsBitField.Flags.SendMessages)) {
            await interaction.reply({ content: `I need to be able to send messages in <#${channel.id}> before you activate the airdrops feature.`, ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });
        const channelEmbed = new EmbedBuilder()
            .setTitle("Random Airdrops will be dropped here!")
            .setColor(<ColorResolvable>this.client.config.embed.darkColor)
            .setThumbnail("https://cdn.coinzbot.xyz/games/airdrop.png")
            .setDescription(":gift: **You will see one airdrop every 1-12 hours.**\n:bangbang: **You can only collect 1 airdrop every 3 hours.**");

        try {
            await (channel as TextChannel).send({ embeds: [channelEmbed] });
        } catch {
            await interaction.editReply({ content: `I need to be able to send messages in <#${channel.id}> before you activate the airdrops feature.` });
            return;
        }

        await Guild.updateOne({ id: interaction.guildId as string }, { $set: { "airdrops.channel": channel.id } });
        await interaction.editReply({ content: `Airdrops will now be dropped in <#${channel.id}>.` });
    }

    private async airdropSetDropRate(interaction: ChatInputCommandInteraction, guild: IGuild) {
        if (!this.hasEnoughPermissions(interaction.member as GuildMember)) {
            await interaction.reply({ content: "You need `Manage Channels` or `Administrator` permissions to use this command.", ephemeral: true });
            return;
        }

        if (!guild.premium.active) {
            await interaction.reply({
                content: "This feature is only available for Premium Servers.\n" +
                    "If you want to use this command, consider buying **Coinz Premium for Servers**.\n" +
                    "Go to the [**store**](<https://coinzbot.xyz/store>) to learn more.", ephemeral: true,
            });
            return;
        }

        const dropRate = interaction.options.getString("drop-rate", true);
        const [minRate, maxRate] = dropRate.split("|").map((x) => parseInt(x, 10));

        await interaction.deferReply({ ephemeral: true });
        await Guild.updateOne({ id: interaction.guildId as string }, {
            $set: {
                "airdrop.interval": {
                    min: minRate,
                    max: maxRate,
                },
            },
        });

        const name = this.dropRateChoices.find((x) => x.value === dropRate)?.name ?? this.dropRateChoices[0].name;
        await interaction.editReply({ content: `Airdrops will now drop ${name.toLowerCase()}.` });
    }

    private hasEnoughPermissions(member: GuildMember) {
        return member.permissions.has(PermissionsBitField.Flags.ManageChannels) || member.permissions.has(PermissionsBitField.Flags.Administrator);
    }
}