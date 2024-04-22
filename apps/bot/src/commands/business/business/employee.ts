import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Colors } from 'discord.js';
import type { ColorResolvable, ChatInputCommandInteraction, User } from 'discord.js';
import type Bot from '../../../domain/Bot';
import { Positions, type BusinessData } from '../../../lib/types';
import type { IEmployee } from '../../../models/business';
import Business from '../../../models/business';
import Member from '../../../models/member';
import type { IMember } from '../../../models/member';
import UserStats from '../../../models/userStats';
import { generateRandomString, msToTime } from '../../../utils';

const COMMAND_NAME = 'business.employee.fire';
const COOLDOWN_TIME = 60 * 60 * 6; // 6 hours

function getConfirmHireActionRow(disabled = false): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('business.employee.hire.accept')
            .setLabel('Accept')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('business.employee.hire.decline')
            .setLabel('Decline')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled),
    );
}

export default async function employee(
    client: Bot,
    interaction: ChatInputCommandInteraction,
    member: IMember,
    data: BusinessData,
) {
    switch (interaction.options.getSubcommand()) {
        case 'hire':
            return hire(client, interaction, member, data);
        case 'fire':
            return fire(client, interaction, data);
        case 'promote':
            return promote(interaction, data);
        default:
            await interaction.reply({ content: client.config.invalidCommand, ephemeral: true });
    }
}

async function hire(client: Bot, interaction: ChatInputCommandInteraction, member: IMember, data: BusinessData) {
    const MAX_EMPLOYEES = member.premium >= 2 ? 6 : 5;
    if (data.employee.position < Positions.Manager) {
        await interaction.reply({
            content: 'You need to be a manager or higher to hire employees.',
            ephemeral: true,
        });
        return;
    } else if (data.business.employees.length >= MAX_EMPLOYEES) {
        let message = `You can only have ${MAX_EMPLOYEES} employees at a time. You need to fire someone before hiring a new employee.`;
        if (member.premium < 2) {
            message += ` If you need to hire more employees, consider upgrading to [**Coinz Pro**](<${client.config.website}/premium>).`;
        }

        await interaction.reply({
            content: message,
            ephemeral: true,
        });
        return;
    }

    await interaction.deferReply();
    const user = interaction.options.getUser('user', true);

    const existingBusiness = await Business.findOne({ 'employees.userId': user.id });
    if (existingBusiness || data.business.employees.some((e) => e.userId === user.id)) {
        await interaction.editReply({
            content: 'This user is already an employee at your or another business.',
        });
        return;
    }

    const confirmEmbed = new EmbedBuilder()
        .setTitle(`Do you want to join ${data.business.name}?`)
        .setDescription(
            `${user} has been offered a job at ${data.business.name}.\n${user}, do you accept or decline this offer? You have 90 seconds to decide.`,
        )
        .setColor(client.config.embed.color as ColorResolvable)
        .setFooter({ text: client.config.embed.footer })
        .setTimestamp();

    let finishedCommand = false;
    const message = await interaction.editReply({
        content: `${user} `,
        embeds: [confirmEmbed],
        components: [getConfirmHireActionRow()],
    });

    const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === user.id,
        time: 90_000,
        componentType: ComponentType.Button,
    });

    collector.on('collect', async (i) => {
        if (finishedCommand) return;

        await i.deferUpdate();
        if (i.customId === 'business.employee.hire.accept') {
            finishedCommand = true;
            const embed = new EmbedBuilder()
                .setTitle(`${user.username} joined ${data.business.name}`)
                .setDescription(`${user} has signed a contract with ${data.business.name} as an employee.`)
                .setColor(Colors.Green);
            await interaction.editReply({ content: '', embeds: [embed], components: [getConfirmHireActionRow(true)] });
            collector.stop();

            let employeeId: string;
            do {
                employeeId = generateRandomString(6);
            } while (data.business.employees.some((e) => e.employeeId === employeeId));

            await Business.updateOne(
                { name: data.business.name },
                { $push: { employees: { employeeId: employeeId, userId: user.id } } },
            );
        } else if (i.customId === 'business.employee.hire.decline') {
            finishedCommand = true;
            const embed = new EmbedBuilder().setTitle(`${user.username} declined the job offer`).setColor(Colors.Red);
            await interaction.editReply({ content: '', embeds: [embed], components: [getConfirmHireActionRow(true)] });
            collector.stop();
        }
    });

    collector.on('end', async () => {
        if (!finishedCommand) {
            finishedCommand = true;

            const embed = new EmbedBuilder()
                .setTitle('Job offer expired')
                .setDescription(
                    `The job offer for ${user} at ${data.business.name} has expired. ${user.username} did not respond in time.`,
                )
                .setColor(Colors.Red);
            await interaction.editReply({ content: '', embeds: [embed], components: [getConfirmHireActionRow(true)] });
        }
    });
}

async function fire(client: Bot, interaction: ChatInputCommandInteraction, data: BusinessData) {
    if (data.employee.position < Positions.Manager) {
        await interaction.reply({
            content: 'You need to be a manager or higher to fire employees.',
            ephemeral: true,
        });
        return;
    } else if (data.business.employees.length <= 1) {
        await interaction.reply({
            content: 'You cannot fire the last employee at your business.',
            ephemeral: true,
        });
        return;
    }

    const cooldown = await client.cooldown.getCooldown(interaction.user.id, COMMAND_NAME);
    if (cooldown) {
        await interaction.reply({
            content: `Please wait ${msToTime(
                Math.abs(Number.parseInt(cooldown, 10) - Math.floor(Date.now() / 1_000)) * 1_000,
            )} before using this command again.`,
            ephemeral: true,
        });
        return;
    }

    const user = interaction.options.getUser('user');
    const employeeId = interaction.options.getString('employee-id');
    const username = interaction.options.getString('username');

    let targetedEmployee: IEmployee | undefined;
    let fetchedUser: User | undefined;
    if (user) {
        targetedEmployee = data.business.employees.find((e) => e.userId === user.id);
    } else if (employeeId) {
        targetedEmployee = data.business.employees.find((e) => e.employeeId === employeeId);
        fetchedUser = await client.users.fetch(targetedEmployee?.userId ?? '');
    } else if (username) {
        try {
            fetchedUser = await client.users.fetch(username);
            targetedEmployee = data.business.employees.find((e) => e.userId === fetchedUser?.id);
        } catch {
            await interaction.reply({
                content: 'You need to provide a user to fire. You can use their username, user id or employee id.',
                ephemeral: true,
            });
            return;
        }
    } else {
        await interaction.reply({
            content: 'You need to provide a user to fire. You can use their username, user id or employee id.',
            ephemeral: true,
        });
        return;
    }

    if (!targetedEmployee || !fetchedUser) {
        await interaction.reply({ content: 'This user is not an employee at your business.', ephemeral: true });
        return;
    }

    if (targetedEmployee.userId === interaction.user.id) {
        await interaction.reply({
            content:
                'You cannot fire yourself. To leave this business use `/business info` and press the leave button.',
            ephemeral: true,
        });
        return;
    } else if (!data.business.employees.some((e) => e.userId === targetedEmployee?.userId)) {
        await interaction.reply({ content: 'This user is not an employee at your business.', ephemeral: true });
        return;
    } else if (
        data.business.employees.some(
            (e) => e.userId === targetedEmployee?.userId && e.position >= data.employee.position,
        )
    ) {
        await interaction.reply({
            content: 'You cannot fire someone with the same or higher position than you.',
            ephemeral: true,
        });
        return;
    }

    const percentage = Math.floor(100 / data.business.employees.length);
    const cut = Math.floor((percentage / 100) * data.business.balance);

    await client.cooldown.setCooldown(interaction.user.id, COMMAND_NAME, COOLDOWN_TIME);
    const embed = new EmbedBuilder()
        .setTitle(`Fired ${fetchedUser.username}`)
        .setDescription(
            `${fetchedUser} has been fired from ${data.business.name} and they received their cut of ${percentage}% (:coin: ${cut}) of the business balance.`,
        )
        .setColor(Colors.Red);
    await interaction.reply({ embeds: [embed] });
    await Business.updateOne(
        { name: data.business.name },
        {
            $inc: { balance: -cut },
            $pull: { employees: { userId: fetchedUser.id } },
        },
    );
    await Member.updateOne({ id: fetchedUser.id }, { $inc: { wallet: cut } });
    await UserStats.updateOne({ id: fetchedUser.id }, { $inc: { totalEarned: cut } }, { upsert: true });
}

async function promote(interaction: ChatInputCommandInteraction, data: BusinessData) {
    if (data.employee.position < Positions.CEO) {
        await interaction.reply({
            content: 'You need to be the CEO to promote employees.',
            ephemeral: true,
        });
        return;
    }

    const user = interaction.options.getUser('user', true);
    const position = interaction.options.getInteger('position', true);

    if (user.id === interaction.user.id) {
        await interaction.reply({
            content: 'You cannot promote yourself. You are already the CEO of this business.',
            ephemeral: true,
        });
        return;
    }

    const employee = data.business.employees.find((e) => e.userId === user.id);
    if (!employee) {
        await interaction.reply({ content: 'This user is not an employee at your business.', ephemeral: true });
        return;
    } else if (employee.position === position) {
        await interaction.reply({ content: 'This user is already in that position.', ephemeral: true });
        return;
    } else if (employee.position >= data.employee.position) {
        await interaction.reply({
            content: 'You cannot promote someone with the same or higher position than you.',
            ephemeral: true,
        });
        return;
    }

    await interaction.reply({
        content: `You have successfully ${
            position > employee.position ? 'promoted' : 'demoted'
        } ${user} to the position of ${Positions[position]}.`,
        ephemeral: true,
    });

    await Business.updateOne(
        { name: data.business.name, 'employees.userId': user.id },
        { $set: { 'employees.$.position': position } },
    );
}
