module.exports.execute = async (client, interaction, data) => {
    await interaction.deferReply();
    const dateNow = Date.now();
    await interaction.editReply({ content: `:ping_pong: **Ping:** ${client.ws.ping} ms\n:speech_balloon: **Responds Time:** ${dateNow - interaction.createdTimestamp} ms\n:white_check_mark: **Uptime:** ${client.calc.msToTime(client.uptime)}` });
}

module.exports.help = {
    name: "ping",
    description: "Get the time between the bot and discord in milliseconds.",
    options: [],
    usage: "",
    category: "misc",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}