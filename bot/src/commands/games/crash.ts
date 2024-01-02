import type { ColorResolvable } from "discord.js";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  ComponentType,
  EmbedBuilder
} from "discord.js";

import type { Command } from '../../domain/Command';
import { addExperience, addMoney, removeBetMoney } from '../../utils/money';

type GameData = {
  profit: number;
  multiplier: number;
  userWon: boolean;
  finishedCommand: boolean;
  color: ColorResolvable;
};

const CRASH_SELL_ID = 'crash_sell';
const SAFE_PROFIT_MULTIPLIER = 0.85;
const MULTIPLIER_INCREMENT = 0.15;
const SELL_BUTTON_DELAY = 2000;
const MAX_COLLECTOR_TIME = 30_000;
const LOSING_CHANCE = 0.23;

function getEmbed(gameData: GameData): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("Crash")
    .setColor(gameData.color)
    .setDescription(`Every **${SELL_BUTTON_DELAY / 1000} seconds** the multiplier goes up by **${MULTIPLIER_INCREMENT}x**.
Every time this happens you have **${LOSING_CHANCE * 100}%** chance to **lose** all money.
To claim the profits, press the sell button.`)
    .addFields(
      { name: "Profit", value: `:coin: ${gameData.profit}`, inline: true },
      { name: "Multiplier", value: `${Math.round(gameData.multiplier * 10) / 10}x`, inline: true },
    );
}

function getButton(isDisabled = false): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(CRASH_SELL_ID)
      .setLabel('Sell')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(isDisabled),
    );
}
export default {
  data: {
    name: 'crash',
    description:
      'Are you fast enough to sell before the market crashes?',
    category: 'games',
    cooldown: 420,
    options: [
      {
        name: 'bet',
        type: ApplicationCommandOptionType.String,
        description: 'The bet you want to place.',
        required: true,
        min_length: 2,
        max_length: 6,
      },
    ],
    extraFields: [
      {
        name: 'Bet Formatting',
        value: 'You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1300~~ **1.3K**\nUse `all` or `max` to use all the money you have or the maximum amount you can bet.',
        inline: false,
      },
    ],
  },
  async execute(client, interaction, member) {
    const betStr = interaction.options.getString("bet", true);

    let bet = 50;
    if (betStr.toLowerCase() === "all" || betStr.toLowerCase() === "max") {
      if (member.wallet <= bet) {
        await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
        await interaction.reply({ content: "You don't have any money in your wallet to bet!", ephemeral: true });
        return;
      }

      bet = Math.min(member.wallet, 10_000);
    } else {
      const newBet = await removeBetMoney(betStr, member);

      if (typeof newBet === "string") {
        await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
        await interaction.reply({ content: newBet, ephemeral: true });
        return;
      }

      bet = newBet;
    }

    // setup
    const gameData: GameData = {
      profit: Math.round(bet * SAFE_PROFIT_MULTIPLIER) - bet,
      multiplier: SAFE_PROFIT_MULTIPLIER,
      userWon: false,
      finishedCommand: false,
      color: client.config.embed.color as ColorResolvable,
    };

    const message = await interaction.reply({
      embeds: [getEmbed(gameData)],
      components: [getButton(gameData.finishedCommand)],
      fetchReply: true
    });
    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      componentType: ComponentType.Button,
      time: MAX_COLLECTOR_TIME,
      max: 1
    });

    collector.on("collect", async (i) => {
      if (i.customId === CRASH_SELL_ID && !gameData.finishedCommand) {
        gameData.finishedCommand = true;
        gameData.userWon = true;
        gameData.color = Colors.Green;
        collector.stop();

        await addMoney(interaction.user.id, gameData.profit + bet);
        await addExperience(member);
        await interaction.editReply({
          embeds: [getEmbed(gameData)],
          components: [getButton(gameData.finishedCommand)]
        });
      }
      await i.deferUpdate();
    });

    collector.on("end", async () => {
      if (!gameData.finishedCommand) {
        gameData.finishedCommand = true;
        await interaction.editReply({ components: [getButton(gameData.finishedCommand)] });
      }
    });

    const interval = setInterval(async () => {
      if (gameData.finishedCommand) {
        clearInterval(interval);
        collector.stop()
        return;
      }

      gameData.multiplier += MULTIPLIER_INCREMENT;
      gameData.profit = Math.round(bet * gameData.multiplier) - bet;

      if (Math.random() <= LOSING_CHANCE) {
        gameData.userWon = false;
        gameData.finishedCommand = true;
        gameData.color = Colors.Red;

        clearInterval(interval);
        collector.stop();
      }

      await interaction.editReply({
        embeds: [getEmbed(gameData)],
        components: [getButton(gameData.finishedCommand)]
      });

      if (gameData.finishedCommand) {
        clearInterval(interval);
        return;
      }
    }, SELL_BUTTON_DELAY);

    setTimeout(async () => {
      clearInterval(interval);

      if (!gameData.finishedCommand) {
        gameData.finishedCommand = true;
        await interaction.editReply({ components: [getButton(gameData.finishedCommand)] });
        return;
      }
    }, MAX_COLLECTOR_TIME);
  }
} satisfies Command;
