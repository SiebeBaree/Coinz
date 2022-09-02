"use strict";

const commands = {
    "plot": {
        "description": "Plant or get a list of your plots.",
        "category": "farming",
        "cooldown": 0,
        "options": [
            {
                "name": "list",
                "options": []
            },
            {
                "name": "plant",
                "options": [
                    {
                        "name": "plot-id",
                        "required": true
                    },
                    {
                        "name": "crop",
                        "required": true
                    }
                ]
            }
        ]
    },
    "company": {
        "description": "Start your own company and become richer than Elon Musk!",
        "category": "business",
        "cooldown": 0,
        "options": [
            {
                "name": "info",
                "options": []
            },
            {
                "name": "inventory",
                "options": []
            },
            {
                "name": "employee",
                "options": [
                    {
                        "name": "add",
                        "options": [
                            {
                                "name": "user",
                                "required": true
                            }
                        ]
                    },
                    {
                        "name": "fire",
                        "options": [
                            {
                                "name": "user",
                                "required": true
                            }
                        ]
                    },
                    {
                        "name": "set-wage",
                        "options": [
                            {
                                "name": "user",
                                "required": true
                            },
                            {
                                "name": "wage",
                                "required": false
                            }
                        ]
                    },
                    {
                        "name": "set-position",
                        "options": [
                            {
                                "name": "user",
                                "required": true
                            },
                            {
                                "name": "position",
                                "required": true
                            }
                        ]
                    }
                ]
            },
            {
                "name": "create",
                "options": [
                    {
                        "name": "name",
                        "required": true
                    }
                ]
            }
        ]
    },
    "factory": {
        "description": "Do stuff with your factories!",
        "category": "business",
        "cooldown": 0,
        "options": [
            {
                "name": "view",
                "options": []
            },
            {
                "name": "set-production",
                "options": [
                    {
                        "name": "factory-id",
                        "required": true
                    },
                    {
                        "name": "product-id",
                        "required": true
                    }
                ]
            },
            {
                "name": "list-products",
                "options": []
            }
        ]
    },
    "balance": {
        "description": "Get your balance or the balance of another user.",
        "category": "economy",
        "cooldown": 0,
        "options": [
            {
                "name": "user",
                "required": false
            }
        ]
    },
    "beg": {
        "description": "If you really want money you can beg for it.",
        "category": "economy",
        "cooldown": 300,
        "options": []
    },
    "crime": {
        "description": "Commit a crime and get the chance to become rich...",
        "category": "economy",
        "cooldown": 900,
        "options": []
    },
    "daily": {
        "description": "Claim your daily reward.",
        "category": "economy",
        "cooldown": 86400,
        "options": []
    },
    "deposit": {
        "description": "Deposit money from your wallet to your bank account.",
        "category": "economy",
        "cooldown": 0,
        "options": [
            {
                "name": "amount",
                "required": true
            }
        ]
    },
    "dig": {
        "description": "Dig up valuable items and sell them for money.",
        "category": "economy",
        "cooldown": 900,
        "options": []
    },
    "fish": {
        "description": "Try and catch some fish that you can sell for money.",
        "category": "economy",
        "cooldown": 900,
        "options": []
    },
    "hunt": {
        "description": "Hunt for animals and get money selling their meat and skin.",
        "category": "economy",
        "cooldown": 900,
        "options": []
    },
    "inventory": {
        "description": "View your or someone's inventory.",
        "category": "economy",
        "cooldown": 0,
        "options": [
            {
                "name": "user",
                "required": false
            }
        ]
    },
    "job": {
        "description": "Apply for a job or get a list with all jobs.",
        "category": "economy",
        "cooldown": 0,
        "options": [
            {
                "name": "list",
                "options": []
            },
            {
                "name": "leave",
                "options": []
            },
            {
                "name": "apply",
                "options": [
                    {
                        "name": "job-name",
                        "required": true
                    }
                ]
            }
        ]
    },
    "monthly": {
        "description": "Claim your monthly reward.",
        "category": "economy",
        "cooldown": 2592000,
        "options": []
    },
    "pay": {
        "description": "Give your mone to another user.",
        "category": "economy",
        "cooldown": 0,
        "options": [
            {
                "name": "user",
                "required": true
            },
            {
                "name": "amount",
                "required": true
            }
        ]
    },
    "profile": {
        "description": "Get your or another user's Coinz profile. You can see detailed information here.",
        "category": "economy",
        "cooldown": 0,
        "options": [
            {
                "name": "user",
                "required": false
            }
        ]
    },
    "shop": {
        "description": "View, buy or sell items with this command.",
        "category": "economy",
        "cooldown": 0,
        "options": [
            {
                "name": "list",
                "options": [
                    {
                        "name": "item-id",
                        "required": false
                    }
                ]
            },
            {
                "name": "buy",
                "options": [
                    {
                        "name": "item-id",
                        "required": true
                    },
                    {
                        "name": "amount",
                        "required": false
                    }
                ]
            },
            {
                "name": "sell",
                "options": [
                    {
                        "name": "item-id",
                        "required": true
                    },
                    {
                        "name": "amount",
                        "required": false
                    }
                ]
            }
        ]
    },
    "weekly": {
        "description": "Claim your weekly reward.",
        "category": "economy",
        "cooldown": 604800,
        "options": []
    },
    "withdraw": {
        "description": "Withdraw money from your bank to your wallet.",
        "category": "economy",
        "cooldown": 0,
        "options": [
            {
                "name": "amount",
                "required": true
            }
        ]
    },
    "work": {
        "description": "Work hard and get paid a unfair salary.",
        "category": "economy",
        "cooldown": 1800,
        "options": []
    },
    "blackjack": {
        "description": "Play a game of blackjack.",
        "category": "games",
        "cooldown": 300,
        "options": [
            {
                "name": "bet",
                "required": true
            }
        ]
    },
    "coinflip": {
        "description": "Flip a coin and guess on what side it's going to land.",
        "category": "games",
        "cooldown": 300,
        "options": [
            {
                "name": "bet",
                "required": true
            },
            {
                "name": "coin-side",
                "required": true
            }
        ]
    },
    "crash": {
        "description": "Are you fast enough to sell before the market crashes?",
        "category": "games",
        "cooldown": 300,
        "options": [
            {
                "name": "bet",
                "required": true
            }
        ]
    },
    "higherlower": {
        "description": "Is the next number higher, lower or the same as the current number.",
        "category": "games",
        "cooldown": 300,
        "options": [
            {
                "name": "bet",
                "required": true
            }
        ]
    },
    "horse-race": {
        "description": "Bet on the fastest horse to earn money.",
        "category": "games",
        "cooldown": 300,
        "options": [
            {
                "name": "bet",
                "required": true
            },
            {
                "name": "horse",
                "required": true
            }
        ]
    },
    "poker": {
        "description": "Play a game of video poker.",
        "category": "games",
        "cooldown": 300,
        "options": [
            {
                "name": "bet",
                "required": true
            }
        ]
    },
    "rock-paper-scissors": {
        "description": "Play rock paper scissors againt the bot",
        "category": "games",
        "cooldown": 300,
        "options": [
            {
                "name": "bet",
                "required": true
            }
        ]
    },
    "roulette": {
        "description": "Play a game of roulette.",
        "category": "games",
        "cooldown": 300,
        "options": [
            {
                "name": "bet",
                "required": true
            },
            {
                "name": "space",
                "required": true
            }
        ]
    },
    "russian-roulette": {
        "description": "Be lucky and don't die with russian roulette.",
        "category": "games",
        "cooldown": 300,
        "options": [
            {
                "name": "bet",
                "required": true
            }
        ]
    },
    "slot-machine": {
        "description": "Try your luck on the slot machines.",
        "category": "games",
        "cooldown": 300,
        "options": [
            {
                "name": "bet",
                "required": true
            }
        ]
    },
    "tictactoe": {
        "description": "Connect 4 X's or O's in a row to win the game. Must be played with 2 users.",
        "category": "games",
        "cooldown": 300,
        "options": [
            {
                "name": "bet",
                "required": true
            },
            {
                "name": "user",
                "required": true
            }
        ]
    },
    "invest": {
        "description": "Buy, sell or get info about an investment.",
        "category": "investing",
        "cooldown": 0,
        "options": [
            {
                "name": "info",
                "options": [
                    {
                        "name": "ticker",
                        "required": false
                    }
                ]
            },
            {
                "name": "buy",
                "options": [
                    {
                        "name": "ticker",
                        "required": true
                    },
                    {
                        "name": "amount",
                        "required": false
                    },
                    {
                        "name": "price",
                        "required": false
                    }
                ]
            },
            {
                "name": "sell",
                "options": [
                    {
                        "name": "ticker",
                        "required": true
                    },
                    {
                        "name": "amount",
                        "required": true
                    }
                ]
            }
        ]
    },
    "portfolio": {
        "description": "Check all your progress in your portfolio.",
        "category": "investing",
        "cooldown": 0,
        "options": []
    },
    "guide": {
        "description": "Get a guide to help you get started with Coinz.",
        "category": "misc",
        "cooldown": 0,
        "options": []
    },
    "help": {
        "description": "Get a list of all commands. To get more info about a specific command use `/help <command>`.",
        "category": "misc",
        "cooldown": 0,
        "options": [
            {
                "name": "command",
                "required": false
            }
        ]
    },
    "info": {
        "description": "Get some information about Coinz.",
        "category": "misc",
        "cooldown": 0,
        "options": []
    },
    "invite": {
        "description": "Get a invite to our Official Support Discord Server",
        "category": "misc",
        "cooldown": 0,
        "options": []
    },
    "ping": {
        "description": "Get the time between the bot and discord in milliseconds.",
        "category": "misc",
        "cooldown": 0,
        "options": []
    },
    "reset": {
        "description": "Reset your account on EVERY server.",
        "category": "misc",
        "cooldown": 300,
        "options": []
    },
    "vote": {
        "description": "Get all the links to the voting sites for rewards.",
        "category": "misc",
        "cooldown": 0,
        "options": []
    },
    "achievement": {
        "description": "Refresh or view your current achievements.",
        "category": "misc",
        "cooldown": 0,
        "options": [
            {
                "name": "list",
                "options": []
            },
            {
                "name": "refresh",
                "options": []
            },
            {
                "name": "select",
                "options": [
                    {
                        "name": "achievement",
                        "required": true
                    }
                ]
            }
        ]
    },
    "notification": {
        "description": "Enable or disable notifications in Coinz.",
        "category": "misc",
        "cooldown": 0,
        "options": [
            {
                "name": "status",
                "required": true
            },
            {
                "name": "notification",
                "required": true
            }
        ]
    },
    "airdrop": {
        "description": "Enable/disable or setup the airdrops channel.",
        "category": "misc",
        "cooldown": 0,
        "options": [
            {
                "name": "toggle",
                "options": []
            },
            {
                "name": "set-channel",
                "options": [
                    {
                        "name": "channel",
                        "required": true
                    }
                ]
            }
        ]
    },
    "connect4": {
        "description": "Play a game of Connect4 with someone.",
        "category": "games",
        "cooldown": 0,
        "options": [
            {
                "name": "bet",
                "required": true
            },
            {
                "name": "user",
                "required": true
            }
        ]
    }
};

function handleCommands(element) {
    const target = element.target.tagName === "DIV" ? element.target : element.target.parentElement;

    if (target.getAttribute("state") === "closed") {
        target.setAttribute("state", "open");

        let pElement = document.createElement("p");

        let usage = "";
        for (let i = 0; i < commands[target.getAttribute("command-name")].options.length; i++) {
            const options = commands[target.getAttribute("command-name")].options[i];

            if (options.options !== undefined) {
                const newOptions = options.options;

                if (newOptions.length > 0) {
                    usage += `/${target.getAttribute("command-name")} ${options.name}`;
                    for (let j = 0; j < newOptions.length; j++) {
                        if (newOptions[j].options !== undefined && newOptions[j].options.length > 0) {
                            if (j > 0) {
                                usage += `/${target.getAttribute("command-name")} ${options.name} ${newOptions[j].name}`;
                            } else {
                                usage += ` ${newOptions[j].name}`;
                            }

                            for (let k = 0; k < newOptions[j].options.length; k++) {
                                let brackets = newOptions[j].options[k].required === true ? ["&lt", "&gt"] : ["[", "]"];
                                usage += ` ${brackets[0]}${newOptions[j].options[k].name}${brackets[1]}`;
                            }

                            if (j < newOptions.length - 1) usage += "<br />";
                        } else {
                            let brackets = newOptions[j].required === true ? ["&lt", "&gt"] : ["[", "]"];
                            usage += ` ${brackets[0]}${newOptions[j].name}${brackets[1]}`;
                        }
                    }
                    usage += "<br />";
                } else {
                    usage += `/${target.getAttribute("command-name")} ${options.name}<br />`;
                }
            } else {
                if (!usage.startsWith(`/${target.getAttribute("command-name")}`)) usage += `/${target.getAttribute("command-name")}`;

                let brackets = options.required === true ? ["&lt", "&gt"] : ["[", "]"];
                usage += ` ${brackets[0]}${options.name}${brackets[1]}`;
            }
        }

        if (usage !== "") {
            let h5Element = document.createElement("h5");

            h5Element.appendChild(document.createTextNode("Usage"));
            pElement.innerHTML = `<code>${usage}</code>`;
            target.appendChild(h5Element);
        } else {
            pElement.appendChild(document.createTextNode("This command has no extra parameters."));
        }

        target.appendChild(pElement);
        target.classList.add("opened");
    } else {
        target.setAttribute("state", "closed");
        target.innerHTML = "";
        target.classList.remove("opened");

        let h4Element = document.createElement("h4");
        let pElement = document.createElement("p");
        pElement.classList.add("command-description");

        target.classList.add("command-item");
        h4Element.appendChild(document.createTextNode(`/${target.getAttribute("command-name")}`));
        pElement.appendChild(document.createTextNode(commands[target.getAttribute("command-name")].description));
        target.appendChild(h4Element);
        target.appendChild(pElement);
    }
}

function handleCategory(element) {
    const categories = document.getElementsByClassName("category-select");

    for (let i = 0; i < categories.length; i++) {
        categories[i].setAttribute("status", "none");
    }

    element.target.setAttribute("status", "selected");
    document.getElementById("commands").innerHTML = "";

    for (const command in commands) {
        if (commands[command].category === element.target.getAttribute("category")) {
            createCommand(command);
        }
    }
}

function createCommand(commandName) {
    let divElement = document.createElement("div");
    let h4Element = document.createElement("h4");
    let pElement = document.createElement("p");

    divElement.classList.add("command-item");
    pElement.classList.add("command-description");
    h4Element.appendChild(document.createTextNode(`/${commandName}`));
    pElement.appendChild(document.createTextNode(commands[commandName].description));
    divElement.appendChild(h4Element);
    divElement.appendChild(pElement);
    divElement.setAttribute("command-name", `${commandName}`);
    divElement.setAttribute("state", "closed");

    divElement.addEventListener("click", handleCommands);
    document.getElementById("commands").appendChild(divElement);
}

function loaded() {
    const categories = document.getElementsByClassName("category-select");

    for (let i = 0; i < categories.length; i++) {
        categories[i].addEventListener("click", handleCategory);
    }

    for (const command in commands) {
        if (commands[command].category === categories[0].getAttribute("category")) {
            createCommand(command);
        }
    }
}

window.addEventListener("load", loaded);