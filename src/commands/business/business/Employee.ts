import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, Colors, ComponentType, EmbedBuilder } from "discord.js";
import Bot from "../../../structs/Bot";
import Command from "../../../structs/Command";
import Member, { IMember } from "../../../models/Member";
import User, { BusinessData } from "../../../utils/User";
import { Info } from "../../../interfaces/ICommand";
import Database from "../../../utils/Database";
import jobs from "../../../assets/jobs.json";
import positions from "../../../assets/positions.json";
import Business from "../../../models/Business";
import Achievement from "../../../utils/Achievement";

export default class extends Command {
    private readonly info: Info;

    constructor(bot: Bot, file: string, info: Info) {
        super(bot, file);
        this.info = info;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember, data: BusinessData) {
        const allowedRoles = ["ceo", "executive"];
        if (!allowedRoles.includes(data.employee.role)) {
            await interaction.reply({ content: "You don't have permission to use this command. You need to be a ceo or executive." });
            return;
        }

        switch (interaction.options.getSubcommand()) {
            case "hire":
                await this.getHire(interaction, member, data);
                break;
            case "fire":
                await this.getFire(interaction, member, data);
                break;
            case "set-payout":
                await this.getSetPayout(interaction, member, data);
                break;
            case "set-postion":
                await this.getSetPosition(interaction, member, data);
                break;
            default:
                await interaction.reply({ content: this.client.config.invalidCommand, ephemeral: true });
        }
    }

    private async getHire(interaction: ChatInputCommandInteraction, member: IMember, data: BusinessData) {
        if (!data.business) {
            await interaction.reply({ content: `You don't own or work at a business. Create one using </${this.info.name} create:1048340073470513155>.`, ephemeral: true });
            return;
        }

        if (User.getLevel(member.experience) < 20) {
            await interaction.reply({ content: "You need to be level 20 to hire employees.", ephemeral: true });
            return;
        }

        if (data.business.employees.length > 8) {
            await interaction.reply({ content: "You can't have more than 8 employees.", ephemeral: true });
            return;
        }

        if (data.business.employees.reduce((a, b) => a + b.payout, 0) > 85) {
            await interaction.reply({ content: "Your total payout is over 85%, you can't hire another employee until you lower the payout of some employees.", ephemeral: true });
            return;
        }

        const employee = interaction.options.getUser("user", true);

        if (employee.id === interaction.user.id || employee.bot) {
            await interaction.reply({ content: "You can't hire a bot or yourself.", ephemeral: true });
            return;
        }

        if (data.business.employees.find((e) => e.userId === employee.id)) {
            await interaction.reply({ content: "This is already an employee of your business.", ephemeral: true });
            return;
        }

        const employeeData = await Database.getMember(employee.id, true);

        if (employeeData.business !== "") {
            await interaction.reply({ content: "This user already works at a business.", ephemeral: true });
            return;
        }

        const job = jobs.find((j) => j.name === employeeData.job);
        if (job && !job.canCombineWithBusiness) {
            await interaction.reply({ content: "This user has a job that doesn't allow that user to work elsewhere.", ephemeral: true });
            return;
        }

        const confirmEmbed = new EmbedBuilder()
            .setTitle(`Join ${data.business.name}?`)
            .setDescription(`${employee.tag} has been offered a job at ${data.business.name}. Do you want to accept?`)
            .setColor(<ColorResolvable>this.client.config.embed.color);

        const row = (disabled = false): ActionRowBuilder<ButtonBuilder> => {
            return new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("business.employee.hire_accept")
                        .setLabel("Join the business")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(disabled),
                );
        };

        let finishedCommand = false;
        const message = await interaction.reply({ content: `<@${employee.id}> `, embeds: [confirmEmbed], components: [row()], fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === employee.id, time: 45_000, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            if (finishedCommand) return;

            if (i.customId === "business.employee.hire_accept") {
                finishedCommand = true;
                await i.deferUpdate();

                if (data.business) {
                    await Member.updateOne({ id: employee.id }, { $set: { business: data.business.name } });
                    await Business.updateOne({ name: data.business.name }, { $push: { employees: { userId: employee.id, role: "employee" } } });

                    const ceo = data.business.employees.find((e) => e.role === "ceo");
                    if (ceo) {
                        const ceoData = await Database.getMember(ceo.userId, true);
                        if (data.business.employees.length + 1 === 8 && !ceoData.badges.includes("going_places")) {
                            await Member.updateOne({ userId: ceoData.id }, { $push: { badges: "going_places" } });

                            const achievement = Achievement.getById("going_places");
                            if (ceoData.id === interaction.user.id) {
                                await interaction.followUp({ content: `You have unlocked the <:${achievement?.id}:${achievement?.emoji}> **${achievement?.name}** badge for having 7 employees (+1 CEO) in your business.`, ephemeral: true });
                            } else {
                                await interaction.followUp({ content: `Your CEO has unlocked the <:${achievement?.id}:${achievement?.emoji}> **${achievement?.name}** badge for having 7 employees (+1 CEO) in your business.`, ephemeral: true });
                            }
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`${employee.tag} joined ${data.business.name}`)
                        .setDescription(`${employee.tag} has signed a contract with ${data.business.name} as an employee.`)
                        .setColor(Colors.Green);
                    await interaction.editReply({ content: "", embeds: [embed], components: [row(true)] });
                }
            }
        });

        collector.on("end", async () => {
            if (!finishedCommand) {
                await interaction.editReply({ components: [row(true)] });
            }
        });
    }

    private async getFire(interaction: ChatInputCommandInteraction, member: IMember, data: BusinessData) {
        if (!data.business) {
            await interaction.reply({ content: `You don't own or work at a business. Create one using </${this.info.name} create:1048340073470513155>.`, ephemeral: true });
            return;
        }

        const employee = interaction.options.getUser("user", true);

        if (employee.id === interaction.user.id) {
            await interaction.reply({ content: "You can't fire yourself.", ephemeral: true });
            return;
        }

        const busEmployee = data.business.employees.find((e) => e.userId === employee.id);
        if (!busEmployee) {
            await interaction.reply({ content: "This user is not an employee of your business.", ephemeral: true });
            return;
        }

        if (busEmployee.role === "ceo") {
            await interaction.reply({ content: "You can't fire the CEO of this business.", ephemeral: true });
            return;
        }

        await interaction.deferReply();
        await Business.updateOne({ name: data.business.name }, { $pull: { employees: { userId: employee.id } } });
        await Member.updateOne({ id: employee.id, business: data.business.name }, { $set: { business: "" } });

        const embed = new EmbedBuilder()
            .setTitle("Fire Employee")
            .setColor(Colors.Red)
            .setDescription(`You fired ${employee.tag} from your business.`);
        await interaction.editReply({ embeds: [embed] });
    }

    private async getSetPayout(interaction: ChatInputCommandInteraction, member: IMember, data: BusinessData) {
        if (!data.business) {
            await interaction.reply({ content: `You don't own or work at a business. Create one using </${this.info.name} create:1048340073470513155>.`, ephemeral: true });
            return;
        }

        const employee = interaction.options.getUser("user", true);
        const payout = interaction.options.getInteger("payout", true);

        const busEmployee = data.business.employees.find((e) => e.userId === employee.id);
        if (!busEmployee) {
            await interaction.reply({ content: "This user is not an employee of your business.", ephemeral: true });
            return;
        }

        if (employee.id === interaction.user.id && busEmployee.role !== "ceo") {
            await interaction.reply({ content: "You can't set your own payout.", ephemeral: true });
            return;
        }

        let totalAllocated = 0;
        for (const emp of data.business.employees) {
            if (emp.userId === employee.id) continue;
            totalAllocated += emp.payout;
        }

        if (totalAllocated + payout > 100) {
            await interaction.reply({ content: `You can only allocate ${100 - totalAllocated}%.`, ephemeral: true });
            return;
        }

        await interaction.deferReply();
        await Business.updateOne({ name: data.business.name, "employees.userId": employee.id }, { $set: { "employees.$.payout": payout } });
        await interaction.editReply({ content: `You set ${employee.tag}'s payout to ${payout}%.` });
    }

    private async getSetPosition(interaction: ChatInputCommandInteraction, member: IMember, data: BusinessData) {
        if (!data.business) {
            await interaction.reply({ content: `You don't own or work at a business. Create one using </${this.info.name} create:1048340073470513155>.`, ephemeral: true });
            return;
        }

        const keys = Object.keys(positions);

        const employee = interaction.options.getUser("user", true);
        const position = interaction.options.getString("position", true);

        if (!keys.includes(position)) {
            await interaction.reply({ content: `Invalid position. Valid positions: ${keys.join(", ")}`, ephemeral: true });
            return;
        }

        const busEmployee = data.business.employees.find((e) => e.userId === employee.id);
        if (!busEmployee) {
            await interaction.reply({ content: "This user is not an employee of your business.", ephemeral: true });
            return;
        }

        if (employee.id === interaction.user.id) {
            await interaction.reply({ content: "You can't set your own position.", ephemeral: true });
            return;
        }

        if ((busEmployee.role === "ceo" || busEmployee.role === "executive") && data.employee.role !== "ceo") {
            await interaction.reply({ content: "You don't have the permissions to set the position of that employee.", ephemeral: true });
            return;
        }

        await interaction.deferReply();
        await Business.updateOne({ name: data.business.name, "employees.userId": employee.id }, { $set: { "employees.$.role": position } });
        await interaction.editReply({ content: `You set ${employee.tag}'s position to ${positions[position as keyof typeof positions]}.` });
    }
}