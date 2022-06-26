const { MessageEmbed } = require('discord.js');
const userSchema = require('../../database/schemas/users');

async function execLinks(client, interaction, data) {
    await interaction.deferReply();
    const unclaimedVotes = data.user.unclaimedVotes === undefined ? 0 : data.user.unclaimedVotes
    const item = await client.database.fetchItem("vote_paper");

    let embed = new MessageEmbed()
        .setTitle(`Coinz Vote Links`)
        .setColor(client.config.embed.color)
        .addFields(
            { name: 'Links', value: `<:topgg:990540015853506590> **Top.gg:** [Click Here](https://top.gg/bot/938771676433362955/vote)\n<:dbl:990540323967103036> **Discordbotlist.com:** [Click Here](https://discordbotlist.com/bots/coinz/upvote)\n<:discords:990631234113781851> **Discords.com:** [Click Here](https://discords.com/bots/bot/938771676433362955/vote)`, inline: false },
            { name: 'Rewards (For each vote)', value: `1x <:${item.itemId}:${item.emoteId}> ${item.name} worth :coin: ${item.sellPrice}\n\n:exclamation: Get 2x <:${item.itemId}:${item.emoteId}> ${item.name} per vote in the weekends when voting on top.gg!`, inline: false }
        )
        .setFooter({ text: client.config.embed.footer })

    if (unclaimedVotes > 0) embed.addField('Unlaimed Votes', `You still haven't claimed ${unclaimedVotes} ${unclaimedVotes === 1 ? "vote" : "votes"}. Please claim them using \`/vote claim\``, false);
    await interaction.editReply({ embeds: [embed] });
}

async function execClaim(client, interaction, data) {
    if (data.user.unclaimedVotes === undefined || data.user.unclaimedVotes <= 0) return await interaction.reply({ content: `You don't have any votes to claim. Please vote using the \`/vote links\` command.`, ephemeral: true });
    await interaction.deferReply();
    let amount = interaction.options.getInteger('amount') || data.user.unclaimedVotes;
    amount = amount > 0 ? amount : 1;

    const item = await client.database.fetchItem("vote_paper");
    await client.tools.giveItem(interaction, data, item.itemId, amount);

    await userSchema.updateOne({ userId: interaction.member.id }, {
        $inc: {
            unclaimedVotes: -amount
        }
    });

    const embed = new MessageEmbed()
        .setTitle(`Claim Vote Rewards`)
        .setColor(client.config.embed.color)
        .setDescription(`You've claimed ${amount}x <:${item.itemId}:${item.emoteId}> ${item.name}.\nYou can sell them using \`/shop sell ${item.itemId} ${amount}\`.`)
        .setFooter({ text: client.config.embed.footer })

    await interaction.editReply({ embeds: [embed] });
}

module.exports.execute = async (client, interaction, data) => {
    if (interaction.options.getSubcommand() === "links") return await execLinks(client, interaction, data);
    if (interaction.options.getSubcommand() === "claim") return await execClaim(client, interaction, data);
    return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${data.cmd.help.name}\`.`, ephemeral: true });
}

module.exports.help = {
    name: "vote",
    description: "Get all the links to the voting sites for rewards.",
    options: [
        {
            name: 'links',
            type: 'SUB_COMMAND',
            description: "Get all the links to the voting sites for rewards.",
            options: []
        },
        {
            name: 'claim',
            type: 'SUB_COMMAND',
            description: "Claim your vote rewards in this server. (You can only use it in 1 server)",
            options: [
                {
                    name: 'amount',
                    type: 'INTEGER',
                    description: 'Claim a number of votes. (Leave blank to claim all votes)',
                    required: false,
                    min_value: 1
                }
            ]
        }
    ],
    category: "misc",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 15,
    enabled: true
}