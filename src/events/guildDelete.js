const Event = require('../structures/Event.js');
const fs = require('fs');

module.exports = class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(guild) {
        if (guild.available) {
            const rawData = fs.readFileSync('src/assets/guildJoinLeave.json');
            let joinLeaveData = JSON.parse(rawData);
            let now = new Date();

            if (joinLeaveData[`${guild.id}`] === undefined) {
                if (guild.memberCount > 50) {
                    joinLeaveData[`${guild.id}`] = {
                        "name": `${guild.name}`,
                        "members": guild.memberCount,
                        "logs": [
                            `REMOVE @ ${now.getDate()}/${now.getMonth()}/${now.getFullYear()} - ${now.getHours()}:${now.getMinutes()}`
                        ]
                    }
                }
            } else {
                joinLeaveData[`${guild.id}`]["name"] = `${guild.name}`;
                joinLeaveData[`${guild.id}`]["members"] = guild.memberCount;
                joinLeaveData[`${guild.id}`]["logs"].push(`REMOVE @ ${now.getDate()}/${now.getMonth()}/${now.getFullYear()} - ${now.getHours()}:${now.getMinutes()}`);
            }

            fs.writeFile('src/assets/guildJoinLeave.json', JSON.stringify(joinLeaveData, null, 4), (err) => {
                if (err) {
                    this.logger.error(err.message);
                } else {
                    this.logger.event(`REMOVE | Name: ${guild.name} | ID: ${guild.id} | Members: ${guild.memberCount}`);
                }
            })
        }
    }
};