import Command from "../../structures/Command.js"
import { EmbedBuilder, ApplicationCommandOptionType, Colors, PermissionsBitField, ChannelType } from "discord.js"
import GuildModel from "../../models/Guild.js"
import { randomNumber } from "../../lib/helpers.js"

export default class extends Command {
    info = {
        name: "server-config",
        description: "Setup the Coinz bot in this server.",
        options: [
            {
                name: 'airdrop',
                type: ApplicationCommandOptionType.SubcommandGroup,
                description: 'Change the airdrop settings.',
                options: [
                    {
                        name: 'toggle',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Toggle the current airdrop status.',
                        options: []
                    },
                    {
                        name: 'set-channel',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Change the current airdrop channel. This is the setup command.',
                        options: [
                            {
                                name: 'channel',
                                type: ApplicationCommandOptionType.Channel,
                                description: 'The channel you want airdrops in.',
                                required: true
                            }
                        ]
                    }
                ]
            }
        ],
        category: "misc",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: false,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (interaction.options.getSubcommandGroup() === "airdrop") {
            if (interaction.options.getSubcommand() === "toggle") return await this.configAirdropToggle(interaction, data);
            else if (interaction.options.getSubcommand() === "set-channel") return await this.configAirdropSetChannel(interaction, data);
        }
        return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help command ${this.info.name}\`.`, ephemeral: true });
    }

    async configAirdropToggle(interaction, data) {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.editReply({ content: `You need \`Manage Channels\` or \`Administrator\` permissions to use this command.` });
        }

        const guild = await bot.database.fetchGuild(interaction.guild.id);
        if (guild.airdropChannel === "") return await interaction.editReply({ content: `You have to setup a channel first. Please use </server-config airdrop set-channel:1048340073470513152>` });
        const newStatus = !guild.airdropStatus;

        await GuildModel.updateOne(
            { id: interaction.guild.id },
            { $set: { airdropStatus: newStatus } }
        );

        const embed = new EmbedBuilder()
            .setTitle(`Airdrop Toggle`)
            .setColor(newStatus ? Colors.Green : Colors.Red)
            .setDescription(`You have **${newStatus ? "enabled" : "disabled"}** the airdrops in <#${guild.airdropChannel}>.`)
        await interaction.editReply({ embeds: [embed] });
    }

    async configAirdropSetChannel(interaction, data) {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.editReply({ content: `You need \`Manage Channels\` or \`Administrator\` permissions to use this command.` });
        }

        const channel = interaction.options.getChannel("channel");
        if (channel.type !== ChannelType.GuildText) return await interaction.editReply({ content: `That's not a text channel. Please only select text channels.` });
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.SendMessages)) return await interaction.editReply({ content: `I don't have the \`Send Messages\` permission.` });
        if (!interaction.guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) return await interaction.editReply({ content: `I can't send any messages in <#${channel.id}>. Please enable the \`Send Messages\` permission in that channel.` });

        const startEmbed = new EmbedBuilder()
            .setTitle("Airdrops have been enabled in this channel")
            .setColor(bot.config.embed.noColor)
            .setThumbnail("https://cdn.coinzbot.xyz/games/airdrop/airdrop.png")
            .setDescription(":gift: **You will see one airdrop every 1-12 hours.**\n:bangbang: **You can only collect 1 airdrop every 3 hours.**")

        try {
            await channel.send({ embeds: [startEmbed] });
        } catch {
            return await interaction.editReply({ content: `I can't send any messages in <#${channel.id}>. Please enable the \`Send Messages\` permission in that channel.` });
        }

        const embed = new EmbedBuilder()
            .setTitle(`The Airdrop channel has been set!`)
            .setColor(bot.config.embed.color)
            .setDescription(`You set the airdrop channel to <#${channel.id}>. You will now get random airdrops.\n\n**Drop rate:** Once every 1-12 hours\n**Rate limits:** The same user can only collect 1 aidrop every 3 hours.`)

        await interaction.editReply({ embeds: [embed] });

        await GuildModel.updateOne(
            { id: interaction.guild.id },
            {
                $set: {
                    airdropStatus: true,
                    airdropChannel: channel.id,
                    airdropNext: parseInt(Date.now() / 1000) + randomNumber(3600, 43200)
                }
            },
            { upsert: true }
        );
    }
}