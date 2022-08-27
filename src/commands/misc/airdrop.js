const Command = require('../../structures/Command.js');
const { EmbedBuilder, PermissionsBitField, ApplicationCommandOptionType, ChannelType, Colors } = require('discord.js');
const GuildModel = require('../../models/Guild');

class Airdrop extends Command {
    info = {
        name: "airdrop",
        description: "Enable/disable or setup the airdrops channel.",
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
        if (interaction.options.getSubcommand() === "toggle") return await this.execToggle(interaction, data);
        if (interaction.options.getSubcommand() === "set-channel") return await this.execSetChannel(interaction, data);
        return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${this.info.name}\`.`, ephemeral: true });
    }

    async execToggle(interaction, data) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({ content: `You need \`Manage Channels\` or \`Administrator\` permissions to use this command.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const guild = await bot.database.fetchGuild(interaction.guild.id);

        if (guild.airdropChannel === "") return await interaction.editReply({ content: `You have to setup a channel first. Please use \`/airdrop set-channel <channel>\`` });
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

    async execSetChannel(interaction, data) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({ content: `You need \`Manage Channels\` or \`Administrator\` permissions to use this command.`, ephemeral: true });
        }

        const channel = interaction.options.getChannel("channel");
        if (channel.type !== ChannelType.GuildText) return await interaction.reply({ content: `That's not a text channel. Please only select text channels.`, ephemeral: true });

        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.SendMessages)) return await interaction.reply({ content: `I don't have the \`Send Messages\` permission.`, ephemeral: true });
        if (!interaction.guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) return await interaction.reply({ content: `I can't send any messages in <#${channel.id}>. Please enable the \`Send Messages\` permission in that channel.`, ephemeral: true });

        const startEmbed = new EmbedBuilder()
            .setTitle("Airdrops have been enabled in this channel")
            .setColor(bot.config.embed.noColor)
            .setThumbnail("https://cdn.coinzbot.xyz/games/airdrop/airdrop.png")
            .setDescription(":gift: **You will see one airdrop every 1-2 hours.**\n:bangbang: **You can only collect 1 airdrop every 90 minutes.**")

        try {
            await channel.send({ embeds: [startEmbed] });
        } catch {
            return await interaction.reply({ content: `I can't send any messages in <#${channel.id}>. Please enable the \`Send Messages\` permission in that channel.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`The Airdrop channel has been set!`)
            .setColor(bot.config.embed.color)
            .setDescription(`You set the airdrop channel to <#${channel.id}>. You will now get random airdrops.\n\n**Drop rate:** Once every 1-2\n**Rate limits:** The same user can only collect 1 aidrop every 90 minutes.`)

        await interaction.reply({ embeds: [embed], ephemeral: true });

        await GuildModel.updateOne(
            { id: interaction.guild.id },
            {
                $set: {
                    airdropStatus: true,
                    airdropChannel: channel.id,
                    airdropNext: parseInt(Date.now() / 1000) + bot.tools.randomNumber(3600, 7200)
                }
            },
            { upsert: true }
        );
    }
}

module.exports = Airdrop;