"use strict";

const faq = [
    {
        title: "What is Coinz and why should I use it?",
        description: "Coinz is a feature-packed discord economy bot. We have everything from A-Z!<br /><br /><b>Some Features Are:</b><ul><li>Trade real-time stocks and crypto.</li><li>Buy Pets, train them and fight with other players.</li><li>Create an account on social media and engage with your followers.</li><li>Manage your business, produce items and hire other users, ...</li><li>Mine your own crypto to sell and become rich.</li><li>And so much more...</li></ul>Do you want to make your server more active? Invite Coinz! Members will love it and have more reason to chat in the other channels!<br />Are You bored? Use Coinz! Coinz is a great way to kill time when you're bored."
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