const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.DATABASE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'coinz',
    keepAlive: true,
    keepAliveInitialDelay: 300000
});

const oldDb = mongoose.connection.useDb('coinz');
const newDb = mongoose.connection.useDb('coinz_v2');

const OldGuildModel = oldDb.model("Guilds", new mongoose.Schema({
    guildId: { type: String, required: true },
    isPremium: { type: Boolean, default: false },
    banned: { type: Boolean, default: false }
}));

const NewGuild = mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    banned: { type: Boolean, default: false }
});

const GuildModel = newDb.model('Guild', NewGuild, 'guilds');

const OldUserModel = oldDb.model("Users", new mongoose.Schema({
    userId: { type: String, require: true },
    isPremium: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    unclaimedVotes: { type: Number, default: 0 },
    totalVotes: { type: Number, default: 0 }
}))

const inventorySchema = new mongoose.Schema({
    itemId: { type: String, require: true },
    quantity: { type: Number, default: 1 }
})

const stocksSchema = new mongoose.Schema({
    ticker: { type: String, require: true },
    quantity: { type: mongoose.Types.Decimal128, require: true },
    buyPrice: { type: Number, require: true }
})

const plotsSchema = new mongoose.Schema({
    plotId: { type: Number, require: true },
    status: { type: String, default: "empty" },
    harvestOn: { type: Number, require: true, default: parseInt(Date.now() / 1000) },
    crop: { type: String, default: "none" }
})

const OldMemberModel = oldDb.model("GuildUsers", new mongoose.Schema({
    userId: { type: String, require: true },
    guildId: { type: String, require: true },
    wallet: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    job: { type: String, default: "" },
    streak: { type: Number, default: 0 },
    lastStreak: { type: Number, default: 0 },
    banned: { type: Boolean, default: false },
    passiveMode: { type: Boolean, default: false },
    inventory: [{ type: inventorySchema }],
    stocks: [{ type: stocksSchema }],
    plots: [{ type: plotsSchema }],
    lastWater: { type: Number, default: parseInt(Date.now() / 1000) }
}))

const Inventory = mongoose.Schema({
    itemId: { type: String, required: true },
    quantity: { type: Number, default: 1 }
});

const Stock = mongoose.Schema({
    ticker: { type: String, required: true },
    quantity: { type: mongoose.Types.Decimal128, required: true },
    buyPrice: { type: Number, required: true }
});

const Plot = mongoose.Schema({
    plotId: { type: Number, required: true },
    status: { type: String, default: "empty" },
    harvestOn: { type: Number, required: true, default: parseInt(Date.now() / 1000) },
    crop: { type: String, default: "none" }
});

const Member = mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    premium: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    votes: { type: Number, default: 0 },
    wallet: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    job: { type: String, default: "" },
    streak: { type: Number, default: 0 },
    lastStreak: { type: Number, default: 0 },
    passiveMode: { type: Boolean, default: false },
    inventory: [{ type: Inventory }],
    stocks: [{ type: Stock }],
    plots: [{ type: Plot }],
    lastWater: { type: Number, default: parseInt(Date.now() / 1000) }
});

const MemberModel = newDb.model('Member', Member, 'members');

async function init() {
    const startDate = parseInt(Date.now() / 1000);

    // MIGRATE TO V2 - GUILDS
    const oldGuilds = await OldGuildModel.find();
    for (let i = 0; i < oldGuilds.length; i++) {
        let obj = await GuildModel.findOne({ id: oldGuilds[i].guildId });
        if (!obj) {
            obj = new GuildModel({ id: oldGuilds[i].guildId });
            await obj.save().catch(err => console.log(err));
        }
        console.log(`Guild #${i}`)
    }

    // MIGRATE TO V2 - MEMBERS
    const oldMembers = await OldMemberModel.find();
    for (let i = 0; i < oldMembers.length; i++) {
        let oldUserObj = await OldMemberModel.findOne({ oldMembers: oldMembers[i].userId });
        let memberObj = await MemberModel.findOne({ id: oldMembers[i].userId });

        if (!oldUserObj) {
            userObj = {
                userId: oldMembers[i].userId,
                banned: false,
                totalVotes: 0,
                unclaimedVotes: 0
            }
        }

        if (memberObj) {
            if (oldMembers[i].wallet + oldMembers[i].bank <= memberObj.wallet + memberObj.bank) continue;

            await MemberModel.updateOne(
                { id: memberObj.id },
                {
                    $set: {
                        wallet: oldMembers[i].wallet,
                        bank: oldMembers[i].bank,
                        job: oldMembers[i].job,
                        streak: oldMembers[i].streak,
                        lastStreak: oldMembers[i].lastStreak,
                        inventory: oldMembers[i].inventory,
                        stocks: oldMembers[i].stocks,
                        plots: oldMembers[i].plots
                    }
                }
            );
        } else {
            const unclaimedVotes = oldUserObj.unclaimedVotes === undefined ? 0 : parseInt(oldUserObj.unclaimedVotes * 125);
            let newMemberObj = {
                id: oldMembers[i].userId,
                votes: oldUserObj.totalVotes,
                wallet: oldMembers[i].wallet + unclaimedVotes,
                bank: oldMembers[i].bank,
                job: oldMembers[i].job,
                streak: oldMembers[i].streak,
                lastStreak: oldMembers[i].lastStreak,
                inventory: oldMembers[i].inventory,
                stocks: oldMembers[i].stocks,
                plots: oldMembers[i].plots
            };

            memberObj = new MemberModel(newMemberObj);
            await memberObj.save().catch(err => console.log(err));
        }

        console.log(`User #${i}`);
    }

    const endDate = parseInt(Date.now() / 1000);
    console.log(`Migrate took ${endDate - startDate} seconds...`)
}

// init()