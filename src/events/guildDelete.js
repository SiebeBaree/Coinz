const fs = require('fs');

module.exports = async (client, guild) => {
    if (guild.available) {
        const rawData = fs.readFileSync('src/data/events/guildJoinLeave.json');
        let joinLeaveData = JSON.parse(rawData);
        let now = new Date();

        if (joinLeaveData[`${guild.id}`] === undefined) {
            joinLeaveData[`${guild.id}`] = {
                "name": `${guild.name}`,
                "members": `${guild.memberCount}`,
                "logs": [
                    `LEAVE @ ${now.getDate()}/${now.getMonth()}/${now.getFullYear()} - ${now.getHours()}:${now.getMinutes()}`
                ]
            }
        } else {
            joinLeaveData[`${guild.id}`]["name"] = `${guild.name}`;
            joinLeaveData[`${guild.id}`]["members"] = `${guild.memberCount}`;
            joinLeaveData[`${guild.id}`]["logs"].push(`LEAVE @ ${now.getDate()}/${now.getMonth()}/${now.getFullYear()} - ${now.getHours()}:${now.getMinutes()}`);
        }

        fs.writeFile('src/data/events/guildJoinLeave.json', JSON.stringify(joinLeaveData, null, 4), (err) => {
            if (err) {
                client.logger.error(err.message);
            } else {
                client.logger.event(`${guild.name} has removed Coinz! (ID: ${guild.id}, Members: ${guild.memberCount})`);
            }
        })
    }
}