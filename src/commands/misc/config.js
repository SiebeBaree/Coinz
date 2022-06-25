const { MessageEmbed, Permissions } = require('discord.js');
const guildUserSchema = require('../../database/schemas/guildUsers');

async function execBan(client, interaction, data) {
    const user = interaction.options.getUser('user');
    if (user.bot) return await interaction.reply({ content: "You can't ban a bot...", ephemeral: true });
    if (user.id === interaction.member.id) return await interaction.reply({ content: "You can't ban yourself...", ephemeral: true });
    if (user.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return await interaction.reply({ content: "You can't ban an admin from using the bot...", ephemeral: true });

    const userData = await client.database.fetchGuildUser(interaction.guildId, user.id);

    if (userData.banned) {
        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: user.id }, { $set: { banned: false } });
        return await interaction.reply({ content: `You unbanned <@${user.id}>.`, ephemeral: true });
    } else {
        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: user.id }, { $set: { banned: true } });
        return await interaction.reply({ content: `You banned <@${user.id}>.`, ephemeral: true });
    }
}

async function execPremiumInfo(client, interaction, data) {
    await interaction.reply({ content: `You're lucky! Coinz is still 100% free! We don't have any paid subscriptions *yet*!\nIf you want to help support Coinz, consider donating [here](https://ko-fi.com/coinz).`, ephemeral: true });
}

async function execPremiumEnable(client, interaction, data) {
    await interaction.reply({ content: `You're lucky! Coinz is still 100% free! We don't have any paid subscriptions *yet*!\nIf you want to help support Coinz, consider donating [here](https://ko-fi.com/coinz).`, ephemeral: true });
}

async function execPremiumDisable(client, interaction, data) {
    await interaction.reply({ content: `You're lucky! Coinz is still 100% free! We don't have any paid subscriptions *yet*!\nIf you want to help support Coinz, consider donating [here](https://ko-fi.com/coinz).`, ephemeral: true });
}

async function execPremiumKeys(client, interaction, data) {
    await interaction.reply({ content: `You're lucky! Coinz is still 100% free! We don't have any paid subscriptions *yet*!\nIf you want to help support Coinz, consider donating [here](https://ko-fi.com/coinz).`, ephemeral: true });
}

module.exports.execute = async (client, interaction, data) => {
    if (interaction.options.getSubcommand() === "ban") return await execBan(client, interaction, data);

    if (interaction.options.getSubcommandGroup() === "premium") {
        if (interaction.options.getSubcommand() === "info") {
            return await execPremiumInfo(client, interaction, data);
        } else if (interaction.options.getSubcommand() === "enable") {
            return await execPremiumEnable(client, interaction, data);
        } else if (interaction.options.getSubcommand() === "disable") {
            return await execPremiumDisable(client, interaction, data);
        } else if (interaction.options.getSubcommand() === "keys") {
            return await execPremiumKeys(client, interaction, data);
        }
    }

    return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${data.cmd.help.name}\`.`, ephemeral: true });
}

module.exports.help = {
    name: "config",
    description: "Change the settings of this bot.",
    options: [
        {
            name: 'ban',
            type: 'SUB_COMMAND',
            description: 'Ban a user from using Coinz. Use this command again to unban.',
            options: [
                {
                    name: 'user',
                    type: 'USER',
                    description: 'The user you want to ban.',
                    required: true
                }
            ]
        },
        {
            name: 'premium',
            type: 'SUB_COMMAND_GROUP',
            description: 'View all premium config settings.',
            options: [
                {
                    name: 'info',
                    type: 'SUB_COMMAND',
                    description: 'Get more info about Coinz Premium.',
                    options: []
                },
                {
                    name: 'enable',
                    type: 'SUB_COMMAND',
                    description: 'Give this server premium perks.',
                    options: [
                        {
                            name: 'key',
                            type: 'STRING',
                            description: 'The premium key you got when buying Coinz Premium.',
                            required: true
                        }
                    ]
                },
                {
                    name: 'disable',
                    type: 'SUB_COMMAND',
                    description: 'Remove the premium status from this server.',
                    options: []
                },
                {
                    name: 'keys',
                    type: 'SUB_COMMAND',
                    description: 'View all your premium keys. (This will be send into your dm)',
                    options: []
                }
            ]
        }
    ],
    category: "misc",
    extraFields: [],
    memberPermissions: ["ADMINISTRATOR"],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}