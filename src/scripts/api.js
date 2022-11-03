require("dotenv").config();
const { Webhook } = require("@top-gg/sdk");
const express = require("express");
const { processVote } = require("./vote.js");

const topggWebhook = new Webhook(process.env.TOPGG_VOTE_WEBHOOK);

const app = express();
app.use(express.json());

app.post("/topggwebhook", topggWebhook.listener(async (vote) => { await processVote(vote.user, "top.gg"); }));
app.post("/dblwebhook", async (request) => { await processVote(request.body.id, "dbl") });

module.exports = app;