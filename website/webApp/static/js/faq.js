"use strict";

const faq = [
    {
        title: "What is Coinz and why should I use it?",
        description: "Coinz is a feature-packed discord economy bot. We have everything from A-Z!<br /><br /><b>Some Features Are:</b><ul><li>Trade real-time stocks and crypto.</li><li>Buy Pets, train them and fight with other players.</li><li>Create an account on social media and engage with your followers.</li><li>Manage your business, produce items and hire other users, ...</li><li>Mine your own crypto to sell and become rich.</li><li>And so much more...</li></ul>Do you want to make your server more active? Invite Coinz! Members will love it and have more reason to chat in the other channels!<br />Are You bored? Use Coinz! Coinz is a great way to kill time when you're bored."
    },
    {
        title: "What is the prefix of Coinz?",
        description: 'Coinz uses only 1 prefix, that is <code>/</code>. Discord introduced Slash Commands and require every bot to use them.<br />More information here: <a href="https://discord.com/blog/welcome-to-the-new-era-of-discord-apps">Slash Commands</a>'
    },
    {
        title: "Can I add my own items to the shop?",
        description: "We don't allow you to add new items to the shop. Coinz uses a global economy so that means you have the same progress on every server."
    },
    {
        title: "Can I set the bot into my own language?",
        description: "We currently don't support any languages other than English."
    },
    {
        title: "How do I restrict who can use commands?",
        description: 'Discord offers a built-in way to enable/disable commands or restrict them to a few roles or users.<br />More information here: <a href="https://support.discord.com/hc/en-us/articles/4644915651095-Command-Permissions">Slash Command Permissions</a>'
    },
    {
        title: "Can I turn the bot off/on in some channels?",
        description: 'Yes you can! This is built-in to the Discord App. Only admins will see the commands in every channel.<br />More information here: <a href="https://discord.com/blog/slash-commands-permissions-discord-apps-bots">Slash Command Permissions</a>'
    },
    {
        title: "How do I start using Coinz?",
        description: "To see all commands use <code>/help</code>, if you really don't know where to start use <code>/guide</code> to get more information about Coinz."
    },
    {
        title: "How do I withdraw the balance of my company?",
        description: "There is currently only one way to withdraw money. That is by using <code>/work</code>, if you don't have enough balance in your company you won't be able to work."
    }
];

function handleFaqData(element) {
    const target = element.target.tagName === "DIV" ? element.target : element.target.parentElement;

    if (target.getAttribute("state") === "closed") {
        target.setAttribute("state", "open");

        let pElement = document.createElement("p");
        pElement.innerHTML = faq[parseInt(target.getAttribute("faq-item-number")) || 0].description;
        target.appendChild(pElement);
        target.classList.add("opened");
    } else {
        target.setAttribute("state", "closed");
        target.innerHTML = "";
        target.classList.remove("opened");

        let h4Element = document.createElement("h4");
        target.classList.add("faq-item");
        h4Element.appendChild(document.createTextNode(faq[parseInt(target.getAttribute("faq-item-number")) || 0].title));
        target.appendChild(h4Element);
    }
}

function createFaqItem(question, number) {
    let divElement = document.createElement("div");
    let h4Element = document.createElement("h4");

    divElement.classList.add("faq-item");
    h4Element.appendChild(document.createTextNode(question));
    divElement.appendChild(h4Element);
    divElement.setAttribute("faq-item-number", `${number}`);
    divElement.setAttribute("state", "closed");

    divElement.addEventListener("click", handleFaqData);
    document.getElementById("faq").appendChild(divElement);
}

function loaded() {
    for (let i = 0; i < faq.length; i++) {
        createFaqItem(faq[i].title, i);
    }
}

window.addEventListener("load", loaded);