<img width="150" height="150" align="left" style="float: left; margin: 0 10px 10px 0;" alt="Crucian" src="https://cdn.coinzbot.xyz/logo.png">

# Coinz
![Language](https://img.shields.io/badge/Language-Node.js-427E38?style=for-the-badge&logo=node.js)
[![invite](https://img.shields.io/badge/Invite-Coinz-DBA514?style=for-the-badge&logo=coil&logoColor=white)](https://coinzbot.xyz/invite)
[![Discord](https://img.shields.io/discord/938177962698735616?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/asnZQwc6kW)

Coinz is an open source Discord.js Bot. Coinz has a boatload of commands and features all related to the economy.

## Features
* All commands are [slash commands](https://discord.com/blog/slash-commands-are-here).
* Real stocks and crypto prices. (API key not included)
* Create your own business inside discord.
* Mine your own crypto.
* Create a social media account.
* Play more than 20 games inside discord.
* Modern dashboard with audit logs.
* Be a farmer and grow some crops.
* Buy pets and level them up. (25+ unique pets)

## Suggestions, bugs, feature requests

Want to contribute? Great, we love that! Please take your time on [opening a new issue](https://github.com/SiebeBaree/Coinz/issues/new).

## Usage
1. [Invite the bot](https://coinzbot.xyz/invite) into your server
2. Run /help in your server and view all commands

*If you need any more help, consider joining our [Coinz support discord](https://coinzbot.xyz/discord).*

## Support Coinz
If you really like this bot, consider donating to Coinz on Patreon.

[![patreon](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/coinz_bot)

If you can't/don't want to donate, that's fine. You can also support Coinz by starring or forking this repository. To make this bot even better consider opening a pull request or issue with a new feature.

## Self-Hosting
We do not recommend self-hosting the bot and website, but it's always an option.

### Self-host Discord bot
To selfhost the bot yourself, you need to have:
* Node - confirmed working on v16.14.0
* npm - comes with Node, the version shouldn't really matter
* A Discord bot token, and having the bot in your server
* An mongodb.com-database set up, as well as a user to it (with write access)
* A clone of the source code, this can be found [here](https://github.com/SiebeBaree/Coinz) and needs to be extracted to a folder.

We will have to do this once:
* Do `npm i` inside the folder, and wait for it to finish.
* Create a file `.env` in the root of the folder.
* Change `/src/assets/config.json` with your default values.

**Example .env file:** *(Do not use `""` or `''`)*
```
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
DATABASE_URI=mongodb://127.0.0.1:27017/
```

After all this, start the bot with `npm run start`.

> ### ⚠ Warning 
> There is literally no warranty if you self-host Coinz, and we will not help you set it up either. If you wish to set the bot and/or website up yourself, we expect you have well enough knowledge in Node.js, Python, mongodb, ... .

## Disclamer
You are not allowed to upload this bot to any service such as discordbotlist or top.gg, you are only allowed to host this bot for your community. You can use small parts of this code in your public bot.

## License
We use the GNU GPLv3-license. If you plan to use any part of this source code in your own bot, we would be grateful if you would include some form of credit somewhere.

> You may copy, distribute and modify the software as long as you track changes/dates in source files. Any modifications to or software including (via compiler) GPL-licensed code must also be made available under the GPL along with build & install instructions.

Fetched from [TLDRLegal](https://tldrlegal.com/license/gnu-general-public-license-v3-(gpl-3)), please also read the [license](https://github.com/SiebeBaree/Coinz/blob/main/LICENSE) if you plan on using the source code. This is only a short summary. Please also take note of that we are not forced to help you, and we won't help you host it yourself as we do not recommend you doing so.