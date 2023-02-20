import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, Colors, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import Cooldown from "../../utils/Cooldown";
import User from "../../utils/User";
import Helpers from "../../utils/Helpers";
import { IGuild } from "../../models/Guild";

interface GameData {
    bet: number;
    finishedCommand: boolean;
    userWon: boolean | null;
    bullet: number;
    chamber: number;
    multiplier: number;
    color: ColorResolvable;
    guild: IGuild;
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "russian-roulette",
        description: "Be lucky and don't die playing russian roulette.",
        options: [
            {
                name: "bet",
                type: ApplicationCommandOptionType.String,
                description: "The bet you want to place.",
                required: true,
                min_length: 2,
                max_length: 6,
            },
        ],
        category: "games",
        extraFields: [
            { name: "Bet Formatting", value: "You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1300~~ **1.3K**\nUse `all` or `max` to use a maximum of :coin: 5000.", inline: false },
        ],
        cooldown: 420,
    };

    private readonly totalSlots = 6;
    private readonly delay = 2500;

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember, guild: IGuild) {
        const betStr = interaction.options.getString("bet", true);

        let bet = 50;
        if (betStr.toLowerCase() === "all" || betStr.toLowerCase() === "max") {
            if (member.wallet <= 0) {
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                await interaction.reply({ content: "You don't have any money in your wallet to bet!", ephemeral: true });
                return;
            }

            bet = Math.min(member.wallet, member.premium.active && member.premium.tier === 2 ? 15_000 : (member.premium.active || guild.premium.active ? 10_000 : 5_000));
        } else {
            const newBet = await User.removeBetMoney(betStr, member, guild);

            if (typeof newBet === "string") {
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                await interaction.reply({ content: newBet, ephemeral: true });
                return;
            }

            bet = newBet;
        }

        const gameData: GameData = {
            bet,
            finishedCommand: false,
            userWon: null,
            bullet: Math.floor(Math.random() * this.totalSlots),
            chamber: 0,
            multiplier: 0,
            color: this.client.config.embed.color as ColorResolvable,
            guild,
        };

        const message = await interaction.reply({ content: this.getContent(gameData), embeds: [this.getEmbed(gameData)], components: [this.getButtons(true)], fetchReply: true });
        await Helpers.getTimeout(this.delay);
        this.pullTrigger(gameData);

        await interaction.editReply({ content: this.getContent(gameData), embeds: [this.getEmbed(gameData)], components: [this.getButtons(gameData.finishedCommand)] });

        if (gameData.finishedCommand) {
            await this.endGame(member, gameData);
            return;
        }

        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: 7, idle: 15_000 });

        collector.on("collect", async (i) => {
            if (!gameData.finishedCommand) {
                if (i.customId === "rr_shoot") {
                    gameData.userWon = null;
                    await i.update({ content: this.getContent(gameData), embeds: [this.getEmbed(gameData)], components: [this.getButtons(true)] });

                    await Helpers.getTimeout(this.delay);
                    this.pullTrigger(gameData);
                } else if (i.customId === "rr_stop") {
                    gameData.finishedCommand = true;
                    await i.deferUpdate();
                }

                if (gameData.finishedCommand) {
                    collector.stop();
                }

                await interaction.editReply({
                    content: this.getContent(gameData),
                    embeds: [this.getEmbed(gameData)],
                    components: [this.getButtons(gameData.finishedCommand)],
                });

                await this.endGame(member, gameData);
            }
        });

        collector.on("end", async () => {
            if (!gameData.finishedCommand) {
                gameData.finishedCommand = true;
                if (gameData.userWon === null) gameData.userWon = false;

                await interaction.editReply({ components: [this.getButtons(gameData.finishedCommand)] });
                await this.endGame(member, gameData);
            }
        });
    }

    private getEmbed(gameData: GameData): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle("Russian Roulette")
            .setDescription("You have a 1/6 chance of shooting the gun with a bullet in the chamber.\n\n:boom: `Shoot` ― **shoot the gun.**\n:no_entry: `Stop` ― **end the game.**")
            .setColor(gameData.color)
            .addFields(
                { name: "Bet Mulitplier", value: `${gameData.multiplier}x`, inline: true },
                { name: "Profit", value: `:coin: ${Math.floor(gameData.multiplier * gameData.bet - gameData.bet)}`, inline: true },
            );
    }

    private getButtons(disabled = false): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("rr_shoot")
                    .setLabel("Shoot")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(disabled),
                new ButtonBuilder()
                    .setCustomId("rr_stop")
                    .setLabel("Stop")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(disabled),
            );
    }

    private pullTrigger(gameData: GameData): void {
        if (gameData.chamber === gameData.bullet || gameData.chamber >= this.totalSlots - 1) {
            gameData.userWon = false;
            gameData.color = Colors.Red;
            gameData.finishedCommand = true;
        } else {
            gameData.chamber++;
            gameData.multiplier += 0.5;
            gameData.userWon = true;
        }
    }

    private getContent(gameData: GameData): string {
        if (gameData.finishedCommand) {
            return gameData.userWon === true ? ":money_with_wings: **GG! You did not die this game!**" : ":skull: **You died and lost your bet.**";
        } else {
            return gameData.userWon === true ? ":tada: **You lived! Your multiplier has increased by 0.5x.**" : ":hourglass_flowing_sand: **Pulling the trigger...**";
        }
    }

    private async endGame(member: IMember, gameData: GameData): Promise<void> {
        if (gameData.finishedCommand) {
            if (gameData.userWon === true) {
                await User.addGameExperience(member, gameData.guild);
                await User.addMoney(member.id, Math.floor(gameData.bet * gameData.multiplier));
            } else {
                await User.removeMoney(member.id, gameData.bet, true);
            }
        }
    }
}