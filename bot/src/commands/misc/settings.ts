import type { ChatInputCommandInteraction, ColorResolvable } from 'discord.js';
import { EmbedBuilder, ApplicationCommandOptionType } from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import type { IMember } from '../../models/member';
import Member from '../../models/member';
import moment from 'moment';
import { getCountryCode, getCountryEmote, getCountryName, isValidCountryCode, msToTime } from '../../utils';

async function settingsNotification(interaction: ChatInputCommandInteraction, member: IMember) {
    const notification = interaction.options.getString('notification', true);
    const value = interaction.options.getString('value', true);

    if (value === 'true' && member.notifications.includes(notification)) {
        await interaction.reply({ content: 'You already have this notification enabled.', ephemeral: true });
        return;
    } else if (value !== 'true' && !member.notifications.includes(notification)) {
        await interaction.reply({ content: 'You already have this notification disabled.', ephemeral: true });
        return;
    }

    await interaction.reply({
        content: `Successfully ${value === 'true' ? 'enabled' : 'disabled'} the notification.`,
        ephemeral: true,
    });

    if (value === 'true') {
        await Member.updateOne({ id: interaction.user.id }, { $push: { notifications: notification } });
    } else {
        await Member.updateOne({ id: interaction.user.id }, { $pull: { notifications: notification } });
    }
}

async function settingsProfileColor(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const color = interaction.options.getString('color', true);
    if (member.profileColor === color) {
        await interaction.reply({ content: 'You already have this profile color set.', ephemeral: true });
        return;
    }

    if (member.premium < 1 && color !== client.config.embed.color) {
        await interaction.reply({
            content: `This feature is reserved for premium users! Upgrade to [**Coinz Plus**](${client.config.website}/premium) or [**Coinz Pro**](${client.config.website}/premium) today!`,
            ephemeral: true,
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`Changed your profile color to \`${color}\`.`)
        .setColor(color as ColorResolvable);
    await interaction.reply({ embeds: [embed] });
    await Member.updateOne({ id: interaction.user.id }, { profileColor: color });
}

async function settingsProfileBirthday(client: Bot, interaction: ChatInputCommandInteraction) {
    const birthday = interaction.options.getString('birthday', true);

    const date = moment(birthday, 'DD/MM/YYYY');
    if (!date.isValid()) {
        await interaction.reply({ content: 'Invalid birthday format, please use DD/MM/YYYY.', ephemeral: true });
        return;
    }

    if (date.isAfter(moment())) {
        await interaction.reply({ content: "Your birthday can't be in the future.", ephemeral: true });
        return;
    }

    if (date.isBefore(moment().subtract(100, 'years'))) {
        await interaction.reply({ content: "Your birthday can't be more than 100 years ago.", ephemeral: true });
        return;
    }

    if (date.isAfter(moment().subtract(13, 'years'))) {
        await interaction.reply({ content: 'You must be at least 13 years old to use Discord.', ephemeral: true });
        return;
    }

    await Member.updateOne({ id: interaction.user.id }, { birthday: date.toDate() });
    const embed = new EmbedBuilder()
        .setTitle(`Set your birthday to \`${date.format('DD/MM/YYYY')}\`.`)
        .setColor(client.config.embed.color as ColorResolvable);
    await interaction.reply({ embeds: [embed] });
}

async function settingsProfileCountry(client: Bot, interaction: ChatInputCommandInteraction) {
    const countryStr = interaction.options.getString('country', true);

    let countryCode = countryStr.toUpperCase();
    let isValidCountry = isValidCountryCode(countryCode);
    if (!isValidCountry) {
        countryCode = getCountryCode(countryStr);
        isValidCountry = isValidCountryCode(countryCode);

        if (!isValidCountry) {
            await interaction.reply({
                content:
                    'Invalid country code or name. use english country names or use the country code. You can find these codes in the discord emotes.\n' +
                    'Example: Emote `:flag_be:` is code `BE` or emote `:flag_us:` is code `US`.',
                ephemeral: true,
            });
            return;
        }
    }

    const countryName = getCountryName(countryCode);
    const countryEmote = getCountryEmote(countryCode);

    const embed = new EmbedBuilder()
        .setTitle(`Set your country to ${countryEmote} ${countryName} (\`${countryCode}\`).`)
        .setColor(client.config.embed.color as ColorResolvable);
    await interaction.reply({ embeds: [embed] });
    await Member.updateOne({ id: interaction.user.id }, { country: countryCode });
}

async function settingsPassiveMode(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const value = interaction.options.getString('value', true);

    const cooldownStr = await client.cooldown.getCooldown(interaction.user.id, 'settings.passive-mode');
    const cooldown = Number.parseInt(cooldownStr ?? "0");
    if (cooldown > 0) {
        await interaction.reply({
            content: `:x: You have to wait ${msToTime(cooldown * 1000)} toggle your passive mode again.`,
            ephemeral: true,
        });
        return;
    }

    if (value === 'true' && member.passiveMode) {
        await interaction.reply({ content: 'You already have passive mode enabled.', ephemeral: true });
        return;
    } else if (value !== 'true' && !member.passiveMode) {
        await interaction.reply({ content: 'You already have passive mode disabled.', ephemeral: true });
        return;
    }

    await client.cooldown.setCooldown(interaction.user.id, 'config.passive-mode', 86400 * 7);
    await interaction.reply({
        content: `Successfully ${value === 'true' ? 'enabled' : 'disabled'} passive mode.`,
        ephemeral: true,
    });
    await Member.updateOne({ id: interaction.user.id }, { passiveMode: value === 'true' });
}

export default {
    data: {
        name: 'settings',
        description: 'Change settings for your account.',
        category: 'misc',
        options: [
            {
                name: 'notification',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Set the status of a notification.',
                options: [
                    {
                        name: 'notification',
                        type: ApplicationCommandOptionType.String,
                        description: 'The notification you want to change.',
                        required: true,
                        choices: [
                            {
                                name: 'Vote Notifications',
                                value: 'vote',
                            },
                            {
                                name: 'Vote Reminders',
                                value: 'vote-reminder',
                            },
                            {
                                name: 'Steal Notifications',
                                value: 'steal',
                            },
                        ],
                    },
                    {
                        name: 'value',
                        type: ApplicationCommandOptionType.String,
                        description: 'Enable/Disable the notification.',
                        required: true,
                        choices: [
                            {
                                name: 'Enable',
                                value: 'true',
                            },
                            {
                                name: 'Disable',
                                value: 'false',
                            },
                        ],
                    },
                ],
            },
            {
                name: 'profile',
                type: ApplicationCommandOptionType.SubcommandGroup,
                description: 'Change your profile settings.',
                options: [
                    {
                        name: 'profile-color',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Change your profile color.',
                        options: [
                            {
                                name: 'color',
                                type: ApplicationCommandOptionType.String,
                                description: 'The color you want to change to.',
                                required: true,
                                choices: [
                                    {
                                        name: 'Default',
                                        value: '#DBA514',
                                    },
                                    {
                                        name: 'White',
                                        value: '#F2F3F5',
                                    },
                                    {
                                        name: 'Black',
                                        value: '#000001',
                                    },
                                    {
                                        name: 'Red',
                                        value: '#CF0A0A',
                                    },
                                    {
                                        name: 'Blue',
                                        value: '#009EFF',
                                    },
                                    {
                                        name: 'Pink',
                                        value: '#F56EB3',
                                    },
                                    {
                                        name: 'Purple',
                                        value: '#A555EC',
                                    },
                                    {
                                        name: 'Green',
                                        value: '#00A758',
                                    },
                                    {
                                        name: 'Dark Grey',
                                        value: '#2F3136',
                                    },
                                    {
                                        name: 'Teal',
                                        value: '#00B9A8',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        name: 'set-birthday',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Set your birthday.',
                        options: [
                            {
                                name: 'birthday',
                                type: ApplicationCommandOptionType.String,
                                description: 'Your birthday in the format of DD/MM/YYYY.',
                                required: true,
                                min_length: 8,
                                max_length: 10,
                            },
                        ],
                    },
                    {
                        name: 'set-country',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Set your country.',
                        options: [
                            {
                                name: 'country',
                                type: ApplicationCommandOptionType.String,
                                description: 'Choose a country. Land code or full name. (BE or Belgium)',
                                required: true,
                                min_length: 2,
                                max_length: 50,
                            },
                        ],
                    },
                ],
            },
            {
                name: 'passive-mode',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Turn passive mode on or off.',
                options: [
                    {
                        name: 'value',
                        type: ApplicationCommandOptionType.String,
                        description: 'Enable/Disable passive mode.',
                        required: true,
                        choices: [
                            {
                                name: 'Enable',
                                value: 'true',
                            },
                            {
                                name: 'Disable',
                                value: 'false',
                            },
                        ],
                    },
                ],
            },
        ],
    },
    async execute(client, interaction, member) {
        switch (interaction.options.getSubcommand()) {
            case 'notification':
                await settingsNotification(interaction, member);
                break;
            case 'profile-color':
                await settingsProfileColor(client, interaction, member);
                break;
            case 'set-birthday':
                await settingsProfileBirthday(client, interaction);
                break;
            case 'set-country':
                await settingsProfileCountry(client, interaction);
                break;
            case 'passive-mode':
                await settingsPassiveMode(client, interaction, member);
                break;
            default:
                await interaction.reply({ content: client.config.invalidCommand, ephemeral: true });
        }
    },
} satisfies Command;
