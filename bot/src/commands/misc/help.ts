import type { APISelectMenuOption, ChatInputCommandInteraction, ColorResolvable } from 'discord.js';
import {
    ComponentType,
    ActionRowBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    ApplicationCommandOptionType,
} from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import { filter, msToTime } from '../../utils';

const categories: { name: string; category: string; icon: string }[] = [
    { name: 'Miscellaneous', category: 'misc', icon: '🔧' },
    { name: 'General', category: 'general', icon: '🪙' },
    { name: 'Games', category: 'games', icon: '🎮' },
    { name: 'Business', category: 'business', icon: '🏢' },
    { name: 'Investing', category: 'investing', icon: '📈' },
];

async function getCategories(client: Bot, interaction: ChatInputCommandInteraction) {
    const getSelectMenu = (defaultLabel = categories[0]!.category, isDisabled = false) => {
        const options = categories.map((cat) => {
            return {
                label: cat.name,
                value: cat.category,
                emoji: cat.icon,
                default: cat.category === defaultLabel,
            } as APISelectMenuOption;
        });

        return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('help-categories')
                .setPlaceholder('Select a category')
                .addOptions(options)
                .setDisabled(isDisabled),
        );
    };

    const getEmbed = (category: string) => {
        const embed = new EmbedBuilder()
            .setAuthor({
                name: `Commands for ${categories
                    .filter((cat) => cat.category === category)
                    .map((cat) => `${cat.icon} ${cat.name}`)
                    .join('')}`,
                iconURL: client.user?.avatarURL() || client.config.embed.icon,
            })
            .setColor(client.config.embed.color as ColorResolvable)
            .setFooter({ text: client.config.embed.footer })
            .setDescription(
                `:question: **Don't know where to begin? Use** \`/help guide\`\n:gear: **Visit our** [**support server**](${client.config.supportServer})**!**\n:bulb: **More info about a command: ** \`/help command <command>\``,
            );

        const commands = client.commands.filter((cmd) => cmd.data.category === category && cmd.data.enabled !== false);

        embed.addFields([
            {
                name: 'Commands',
                value:
                    commands.size > 0 ? commands.map((cmd) => `\`${cmd.data.name}\``).join(', ') : 'No commands found.',
                inline: false,
            },
        ]);

        return embed;
    };

    let category = categories[0]!.category;
    const message = await interaction.reply({
        embeds: [getEmbed(category)],
        components: [getSelectMenu(category)],
        fetchReply: true,
    });
    const collector = message.createMessageComponentCollector({
        filter: async (i) => filter(interaction, i),
        max: 7,
        time: 90_000,
        componentType: ComponentType.StringSelect,
    });

    collector.on('collect', async (i) => {
        if (i.customId === 'help-categories') {
            category = i.values[0]!;
            await i.update({ embeds: [getEmbed(category)], components: [getSelectMenu(category)] });
        }
    });

    collector.on('end', async () => {
        await interaction.editReply({ components: [getSelectMenu(category, true)] });
    });
}

async function getCommand(client: Bot, interaction: ChatInputCommandInteraction) {
    const commandName = interaction.options.getString('command', true).toLowerCase();
    const command = client.commands.get(commandName);

    if (!command || command.data.category === 'admin') {
        await interaction.reply({
            content: `\`/${commandName}\` is not a valid command. Use \`/help categories\` to view all commands.`,
            ephemeral: true,
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setAuthor({
            name: `Help: ${command.data.name}`,
            iconURL: client.user?.avatarURL() || client.config.embed.icon,
        })
        .setColor(client.config.embed.color as ColorResolvable)
        .setFooter({ text: client.config.embed.footer })
        .setDescription(
            `:question: **Don't know where to begin? Use** \`/help guide\`\n:gear: **Visit our** [**support server**](${client.config.supportServer})**!**`,
        )
        .addFields(
            { name: 'Description', value: '>>> ' + (command.data.description ?? 'No Description.'), inline: false },
            {
                name: 'Command Usage',
                value: command.data.usage
                    ? command.data.usage.map((usage) => `\`/${command.data.name} ${usage}\``).join('\n')
                    : `\`/${command.data.name}\``,
                inline: false,
            },
            {
                name: 'Cooldown',
                value: command.data.cooldown === undefined ? '5s' : msToTime(command.data.cooldown * 1000),
                inline: false,
            },
        );

    if (command.data.extraFields !== undefined) {
        for (const field of command.data.extraFields) {
            embed.addFields(field);
        }
    }

    if (command.data.image !== undefined) {
        embed.setImage(command.data.image);
    }

    await interaction.reply({ embeds: [embed] });
}

export default {
    data: {
        name: 'help',
        description: 'Get a list of all commands or get more info about a specific command.',
        category: 'misc',
        options: [
            {
                name: 'command',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get more information about a specific command.',
                options: [
                    {
                        name: 'command',
                        type: ApplicationCommandOptionType.String,
                        description: 'The command you want to get more information about.',
                        required: true,
                    },
                ],
            },
            {
                name: 'categories',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get all possible commands in a specific category.',
                options: [],
            },
        ],
    },
    async execute(client, interaction) {
        switch (interaction.options.getSubcommand()) {
            case 'categories':
                await getCategories(client, interaction);
                break;
            case 'command':
                await getCommand(client, interaction);
                break;
            default:
                await interaction.reply({ content: client.config.invalidCommand, ephemeral: true });
        }
    },
} satisfies Command;
