const { MessageEmbed } = require('discord.js');
const cooldownsSchema = require("../../database/schemas/cooldowns");

module.exports.execute = async (client, interaction, data) => {
    const member = interaction.options.getUser('user') || interaction.member;
    if (member.bot) return interaction.reply({ content: 'That user is a bot. You can only check the profile of a real person.', ephemeral: true });
    await interaction.deferReply();
    const memberData = await client.database.fetchGuildUser(interaction.guildId, member.id);
    const netWorth = await client.calc.getNetWorth(client, memberData);

    let job = memberData.job === "" ? "None" : memberData.job;
    if (memberData.business !== undefined && memberData.business.name.length > 0) job = "Business CEO";

    let cooldownsAmount = 0;
    let cooldowns = await cooldownsSchema.find({ guildId: interaction.guildId, userId: member.id });
    let cooldownStr = "";

    for (let i = 0; i < cooldowns.length; i++) {
        if (cooldowns[i].expiresOn > parseInt(Date.now() / 1000) && cooldownsAmount <= 10) {
            cooldownStr += `**${cooldowns[i].command}:** ${client.calc.msToTime(cooldowns[i].expiresOn * 1000 - Date.now())}\n`;
            cooldownsAmount++;
        }
    }

    if (cooldowns.length > 10) {
        cooldownStr += `and \`${cooldowns.length - cooldownsAmount}\` more cooldowns...`;
    } else if (cooldownStr === "") {
        cooldownStr = "There are no cooldowns found for this user.";
    }

    const embed = new MessageEmbed()
        .setAuthor({ name: `${member.displayName || member.username}'s profile`, iconURL: `${member.displayAvatarURL() || client.config.embed.defaultIcon}` })
        .setColor(client.config.embed.color)
        .setThumbnail(member.displayAvatarURL() || client.config.embed.defaultIcon)
        .addFields(
            { name: 'Experience', value: `Coming Soon`, inline: true },
            { name: 'Level', value: `Coming Soon`, inline: true },
            { name: 'Balance', value: `:dollar: **Wallet:** :coin: ${memberData.wallet}\n:credit_card: **Bank:** :coin: ${memberData.bank}\n:moneybag: **Net Worth:** :coin: ${netWorth.netWorth}\n:gem: **Inventory Worth:** \`${netWorth.items} items\` valued at :coin: ${netWorth.invValue}`, inline: false },
            { name: 'Investment Portfolio', value: `:dollar: **Worth:** :coin: ${netWorth.portfolioValue}\n:credit_card: **Amount of Stocks:** ${parseInt(netWorth.stockItems)} stocks\n:moneybag: **Invested:** :coin: ${netWorth.initialValue}`, inline: false },
            { name: 'Misc', value: `:briefcase: **Current Job:** ${job}\n:sparkles: ** Streak:** ${memberData.streak} days\n:no_entry: ** Banned:** ${memberData.banned ? "Yes" : "No"}\n:shield: ** Passive Mode:** ${memberData.passiveMode ? "On" : "Off"}\n`, inline: false },
            { name: 'Cooldowns', value: `${cooldownStr}`, inline: false }
        )
    await interaction.editReply({ embeds: [embed] });
}

module.exports.help = {
    name: "profile",
    description: "Get your or another user's Coinz profile. You can see detailed information here.",
    options: [
        {
            name: 'user',
            type: 'USER',
            description: 'Get the profile of another user.',
            required: false
        }
    ],
    category: "misc",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}