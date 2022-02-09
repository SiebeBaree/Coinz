# Coinz
![Language](https://img.shields.io/badge/Language-Node.js-427E38?style=for-the-badge&logo=node.js)
![Downloads](https://img.shields.io/github/downloads/SiebeBaree/Coinz/total?style=for-the-badge&logo=github)
![License](https://img.shields.io/github/license/SiebeBaree/Coinz?style=for-the-badge&logo=github)
![Repo Size](https://img.shields.io/github/languages/code-size/SiebeBaree/Coinz?style=for-the-badge&label=SIZE&logo=databricks&logoColor=white)
[![invite](https://img.shields.io/badge/Invite-Coinz-DBA514?style=for-the-badge&logo=coil&logoColor=white)](https://coinzbot.xyz/invite)
[![Discord](https://img.shields.io/discord/938177962698735616?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/asnZQwc6kW)

Coinz is an open source Discord.js Bot. Coinz has over 70+ commands and more than 40 ways to make money.

## Features
* All commands are [slash commands](https://discord.com/blog/slash-commands-are-here).
* Real stocks and crypto prices. (API key not included)
* Create your own business inside discord.
* Mine your own crypto.
* Create a social media account.
* Play more than 20 games inside discord.
* Modern dashboard with audit logs.
* Buy pets and level them up. (25+ unique pets)

## Suggestions, bugs, feature requests

Want to contribute? Great, we love that! Please take your time on [opening a new issue](https://github.com/SiebeBaree/Coinz/issues/new).

## Usage
1. [Invite the bot](https://coinzbot.xyz/invite) into your server
2. Run /help in your server and view all commands

*If you need any more help, consider joining our [Coinz support discord](https://coinzbot.xyz/discord).*

## Support Coinz
If you really like this bot, consider donating to Coinz on Ko-fi.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/J3J54IS5U)

If you can't/don't want to donate, that's fine. You can also support Coinz by starring or forking this repository. To make this bot even better consider opening a pull request or issue with a new feature.

## Self-Hosting
We do not recommend self-hosting the bot and website, but it's always an option.

### Self-host Discord bot
To selfhost the bot yourself, you need to have:
* Node - confirmed working on v17.0.1
* npm - comes with Node, the version shouldn't really matter
* A Discord bot token, and having the bot in your server
* An mongodb.com-database set up, as well as a user to it (with write access)
* A clone of the source code, this can be found [here](https://github.com/SiebeBaree/Coinz) and needs to be extracted to a folder.

We will have to do this once:
* Do `npm i` inside the folder, and wait for it to finish.
* Create a file `.env` in the root of the folder.
* Change `/src/config.json` with your default values.

**Example .env file:** *(Do not use `""` or `''`)*
```
TOKEN=YOUR_BOT_TOKEN_HERE
DATABASE_URI=mongodb://127.0.0.1:27017/
```

After all this, start the bot with `npm run start`.

### Self-host Website
To selfhost the website yourself, you need to have:
* Python - confirmed working on v3.9.7
* pip - comes with Python, the version shouldn't really matter (at least 2.x)
* OAuth2 Redirects setup (You can find the OAuth2 tab in your discord application)
* All packages installed (List of all packages in `/website/requirements.txt`)
* A clone of the source code, this can be found [here](https://github.com/SiebeBaree/Coinz) and needs to be extracted to a folder.

We will have to do this once:
* Rename `example.config.py` to `config.py`.
* Change `config.py` with your default values.

**OAuth2 Redirects:** *(For local testing change `https://www.your-website-here.com` to `http://127.0.0.1:5000`)*
```
https://www.your-website-here.com/callback
https://www.your-website-here.com/dashboard
```

After all this, run `python3 website/coinzbot.py`.

> ### ⚠ Warning 
> There is literally no warranty if you self-host Coinz, and we will not help you set it up either. If you wish to set the bot and/or website up yourself, we expect you have well enough knowledge in Node.js and Python.

## Disclamer
You are not allowed to upload this bot to any service such as discordbotlist or top.gg, you are only allowed to host this bot for your community. You can use small parts of this code in your public bot.

## License
We use the MIT license. If you plan to use any part of this source code in your own bot, we would be grateful if you would include some form of credit somewhere.

> A short, permissive software license. Basically, you can do whatever you want as long as you include the original copyright and license notice in any copy of the software/source.  There are many variations of this license in use.

Fetched from [TLDRLegal](https://tldrlegal.com/license/mit-license), please also read the [license](https://github.com/SiebeBaree/Coinz/blob/master/LICENSE) if you plan on using the source code. This is only a short summary. Please also take note of that we are not forced to help you, and we won't help you host it yourself as we do not recommend you doing so.