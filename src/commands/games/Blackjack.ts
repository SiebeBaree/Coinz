import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, Colors, ComponentType, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import User from "../../utils/User";
import Cooldown from "../../utils/Cooldown";
import { deck, hiddenCard } from "../../assets/cards.json";

interface Card {
    name: string;
    emoteId: string;
    value: number;
}

interface GameData {
    bet: number;
    finishedCommand: boolean;
    userWon: boolean;
    tie: boolean;
    color: ColorResolvable;
    userHand: Card[];
    dealerHand: Card[];
    description?: string;
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "blackjack",
        description: "Play a game of blackjack.",
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

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const betStr = interaction.options.getString("bet", true);

        let bet = 50;
        if (betStr.toLowerCase() === "all" || betStr.toLowerCase() === "max") {
            if (member.wallet <= 0) {
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                await interaction.reply({ content: "You don't have any money in your wallet to bet!", ephemeral: true });
                return;
            }

            bet = Math.min(member.wallet, 10_000);
        } else {
            const newBet = await User.removeBetMoney(betStr, member);

            if (typeof newBet === "string") {
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                await interaction.reply({ content: newBet, ephemeral: true });
                return;
            }

            bet = newBet;
        }

        // setup
        let disableDoubleDown = bet * 2 > member.wallet;
        const gameData: GameData = {
            bet: bet,
            userWon: false,
            finishedCommand: false,
            color: this.client.config.embed.color as ColorResolvable,
            userHand: [],
            dealerHand: [],
            tie: false,
        };

        this.startGame(gameData);
        this.checkStatus(gameData);
        if (gameData.finishedCommand) {
            this.endGame(gameData);
            this.checkStatus(gameData);

            if (gameData.userWon) {
                await User.addGameExperience(member);
                await User.addMoney(interaction.user.id, this.getReward(gameData.bet));

                if (!member.badges.includes("easy_blackjack")) {
                    await Member.updateOne({ id: interaction.user.id }, { $push: { badges: "easy_blackjack" } });
                }
            } else if (gameData.tie) {
                await User.addMoney(interaction.user.id, gameData.bet);
            }
        }

        const message = await interaction.reply({ embeds: [this.getEmbed(gameData)], components: [this.getButton(gameData.finishedCommand, disableDoubleDown)], fetchReply: true });
        if (gameData.finishedCommand) return;

        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, componentType: ComponentType.Button, time: 90_000, max: 5 });

        collector.on("collect", async (i) => {
            if (gameData.finishedCommand) return;

            if (i.customId.startsWith("bj_")) {
                await i.deferUpdate();
                if (i.customId === "bj_hit") {
                    this.runHit(gameData);
                    disableDoubleDown = true;
                } else if (i.customId === "bj_stand") {
                    this.runStand(gameData);
                } else if (i.customId === "bj_doubleDown") {
                    await User.removeMoney(interaction.user.id, gameData.bet, true);
                    this.runDoubleDown(gameData);
                }

                this.checkStatus(gameData);
                if (gameData.finishedCommand) {
                    this.endGame(gameData);
                    this.checkStatus(gameData);
                    gameData.color = gameData.userWon ? Colors.Green : Colors.Red;

                    if (gameData.userWon) {
                        await User.addGameExperience(member);
                        await User.addMoney(interaction.user.id, this.getReward(gameData.bet));
                    } else if (gameData.tie) {
                        await User.addMoney(interaction.user.id, gameData.bet);
                    }
                }

                await interaction.editReply({ embeds: [this.getEmbed(gameData)], components: [this.getButton(gameData.finishedCommand, disableDoubleDown)] });
            }
        });

        collector.on("end", async () => {
            if (!gameData.finishedCommand) {
                gameData.finishedCommand = true;
                this.endGame(gameData);
                this.checkStatus(gameData);
                gameData.color = gameData.userWon ? Colors.Green : Colors.Red;

                if (gameData.userWon) {
                    await User.addGameExperience(member);
                    await User.addMoney(interaction.user.id, this.getReward(gameData.bet));
                } else if (gameData.tie) {
                    await User.addMoney(interaction.user.id, gameData.bet);
                }

                await interaction.editReply({ embeds: [this.getEmbed(gameData)], components: [this.getButton(gameData.finishedCommand, disableDoubleDown)] });
            }
        });
    }

    private getEmbed(gameData: GameData): EmbedBuilder {
        const desc = gameData.description ? `Result: ${gameData.description}` :
            ":boom: `Hit` ― **take another card.**\n:no_entry: `Stand` ― **end the game.**\n:money_with_wings: `Double Down` ― **double your bet, hit once, then stand.**";

        return new EmbedBuilder()
            .setTitle("Blackjack")
            .setColor(gameData.color)
            .setDescription(desc)
            .addFields(
                { name: "Your Hand", value: `${this.getHandString(gameData.userHand)}\n\n**Value:** ${this.getHandValue(gameData.userHand)}`, inline: true },
                { name: "Dealer's Hand", value: `${this.getHandString(gameData.dealerHand)}\n\n**Value:** ${this.getHandValue(gameData.dealerHand)}`, inline: true },
            );
    }

    private getButton(isDisabled = false, doubleDownDisabled = true): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("bj_hit")
                    .setLabel("Hit")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(isDisabled),
                new ButtonBuilder()
                    .setCustomId("bj_stand")
                    .setLabel("Stand")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(isDisabled),
                new ButtonBuilder()
                    .setCustomId("bj_doubleDown")
                    .setLabel("Double Down")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(isDisabled || doubleDownDisabled),
            );
    }

    private startGame(gameData: GameData) {
        gameData.userHand.push(this.getRandomCard());
        gameData.userHand.push(this.getRandomCard());
        gameData.dealerHand.push(this.getRandomCard());
        gameData.dealerHand.push(hiddenCard);
    }

    private endGame(gameData: GameData) {
        gameData.finishedCommand = true;

        if (gameData.dealerHand[1].value === 0) {
            gameData.dealerHand[1] = this.getRandomCard();
        }

        while (this.getHandValue(gameData.dealerHand) < 17) {
            gameData.dealerHand.push(this.getRandomCard());
        }
    }

    private checkStatus(gameData: GameData) {
        const valueUser = this.getHandValue(gameData.userHand);
        const valueDealer = this.getHandValue(gameData.dealerHand);
        const finishedBefore = gameData.finishedCommand;

        gameData.userWon = false;
        gameData.tie = false;
        gameData.finishedCommand = true;

        if (valueUser === 21 && valueDealer === 21) {
            gameData.tie = true;
            gameData.description = `Blackjack Push! You got :coin: ${gameData.bet} back.`;
        } else if (valueUser > 21) {
            gameData.description = `You bust! You lost :coin: ${gameData.bet}`;
        } else if (valueUser === 21) {
            gameData.userWon = true;
            gameData.description = `Blackjack! You won :coin: ${this.getReward(gameData.bet)}`;
        } else if (valueDealer > 21) {
            gameData.userWon = true;
            gameData.description = `Dealer bust! You won :coin: ${this.getReward(gameData.bet)}`;
        } else if (valueDealer === valueUser && finishedBefore) {
            gameData.tie = true;
            gameData.description = `Push! You got :coin: ${gameData.bet} back.`;
        } else if (valueUser > valueDealer && finishedBefore) {
            gameData.userWon = true;
            gameData.description = `You won :coin: ${this.getReward(gameData.bet)}`;
        } else if (valueDealer > valueUser && finishedBefore) {
            gameData.description = `You lost :coin: ${gameData.bet}`;
        } else if (!finishedBefore) {
            gameData.finishedCommand = false;
        }
    }

    private getRandomCard(): Card {
        return deck[Math.floor(Math.random() * deck.length)];
    }

    private getHandValue(hand: Card[]): number {
        let value = hand.reduce((acc, card) => acc + card.value, 0);

        const hasAce = hand.some((card) => card.value === 11);
        if (hasAce && value > 21) value -= 10;

        return value;
    }

    private getHandString(hand: Card[]): string {
        return hand.map((card) => `<:${card.name}:${card.emoteId}>`).join(" ");
    }

    private getReward(bet: number): number {
        return Math.round(bet * 1.5);
    }

    private runHit(gameData: GameData) {
        gameData.userHand.push(this.getRandomCard());
        if (gameData.userHand.length >= 6) gameData.finishedCommand = true;
    }

    private runStand(gameData: GameData) {
        gameData.finishedCommand = true;
    }

    private runDoubleDown(gameData: GameData) {
        gameData.bet *= 2;
        gameData.userHand.push(this.getRandomCard());
        gameData.finishedCommand = true;
    }
}