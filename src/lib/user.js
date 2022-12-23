import { fetchMember } from './database.js'
import MemberModel from '../models/Member.js'
import Business from '../models/Business.js'

export const addMoney = async (userId, amount) => {
    await MemberModel.updateOne({ id: userId }, { $inc: { wallet: amount } });
}

export const takeMoney = async (userId, amount, goNegative = true) => {
    const UserData = await fetchMember(userId);
    if (UserData.wallet - amount < 0 && !goNegative) amount = UserData.wallet;
    await addMoney(userId, -amount);
}

export const addItem = async (userId, itemId, quantity = 1, inventory = []) => {
    if (checkItem(inventory, itemId)) {
        await MemberModel.updateOne({ id: userId, 'inventory.itemId': itemId }, {
            $inc: { 'inventory.$.quantity': quantity }
        });
    } else {
        await MemberModel.updateOne({ id: userId }, {
            $push: {
                inventory:
                {
                    itemId: itemId,
                    quantity: quantity
                }
            },
        });
    }
}

export const takeItem = async (userId, itemId, inventory, quantity = 1) => {
    const item = checkItem(inventory, itemId, true);
    if (!item) return false;

    if (item.quantity - quantity > 0) {
        await MemberModel.updateOne({ id: userId, 'inventory.itemId': item.itemId }, {
            $inc: { 'inventory.$.quantity': -quantity }
        });
    } else {
        await MemberModel.updateOne({ id: userId }, {
            $pull: { 'inventory': { itemId: item.itemId } }
        });
    }

    return true;
}

export const checkItem = (inventory, itemId, new_ = false) => {
    for (let i = 0; i < inventory.length; i++) {
        if (inventory[i].itemId === itemId) {
            return new_ === true ? inventory[i] : true;
        }
    }

    return false;
}

export const getBusiness = async (userData) => {
    let returnData = {
        userId: userData.id,
        company: null,
        isOwner: false,
        employee: null,
    }

    if (userData.job === 'business') {
        const company = await Business.findOne({ ownerId: userData.id });
        if (company) {
            returnData.company = company;
            returnData.isOwner = true;
        }
    } else if (userData.job.startsWith('business-')) {
        const ownerId = userData.job.split('-')[1];
        const company = await Business.findOne({ ownerId: ownerId });

        if (company) {
            let isEmployee = false;
            for (let i = 0; i < company.employees.length; i++) {
                if (company.employees[i].userId === userData.id) {
                    isEmployee = true;
                    returnData.employee = company.employees[i];
                    break;
                }
            }

            if (isEmployee) {
                returnData.company = company;
            }
        }
    }

    return returnData;
}

export const getLevel = (experience) => {
    return Math.floor(experience / 100);
}

export const getExperience = () => {
    return Math.floor(Math.random() * 4) + 1;
}

export const addRandomExperience = async (userId, exp = -1) => {
    const experience = exp < 0 ? getExperience() : exp;
    await MemberModel.updateOne(
        { id: userId },
        { $inc: { experience: experience } },
        { upsert: true }
    );

    return experience;
}

export default {
    addMoney,
    takeMoney,
    addItem,
    takeItem,
    checkItem,
    getBusiness,
    getLevel,
    getExperience,
    addRandomExperience
}