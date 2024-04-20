<a name="coinz-top"></a>

<br />
<div align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="https://cdn.coinzbot.xyz/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Coinz</h3>

  <p align="center">
    An advanced Discord economy bot with real-time financial data, minigames like blackjack, roulette, and business management features.
    <br />
    <a href="https://coinzbot.xyz/invite"><strong>Invite Coinz »</strong></a>
    <br />
    <br />
    <a href="https://coinzbot.xyz">Website</a>
    ·
    <a href="https://github.com/SiebeBaree/Coinz/issues/new?labels=bug">Report Bug</a>
    ·
    <a href="https://github.com/SiebeBaree/Coinz/issues/new?labels=enhancement">Request Feature</a>
  </p>

[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/SiebeBaree/Coinz/.github/workflows/main.yml?style=for-the-badge&logo=github-actions&logoColor=ffcb1f&labelColor=272830&color=ffcb1f)](https://github.com/SiebeBaree/Coinz/actions)
![GitHub top language](https://img.shields.io/github/languages/top/SiebeBaree/Coinz?style=for-the-badge&logo=typescript&logoColor=ffcb1f&labelColor=272830&color=ffcb1f)
[![Discord](https://img.shields.io/discord/938177962698735616?style=for-the-badge&logo=discord&logoColor=ffcb1f&labelColor=272830&color=ffcb1f)](https://coinzbot.xyz/support)
![GitHub Repo stars](https://img.shields.io/github/stars/SiebeBaree/Coinz?style=for-the-badge&logo=github&logoColor=ffcb1f&labelColor=272830&color=ffcb1f)

</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-coinz">About Coinz</a>
      <ul>
        <li><a href="#tech-stack">Techstack</a></li>
      </ul>
    </li>
    <li><a href="#features">Features</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li>
      <a href="#contributing">Contributing</a>
      <ul>
        <li><a href="#developers">Developers</a></li>
        <li><a href="#users">Users</a></li>
      </ul>
    </li>
    <li><a href="#support-coinz">Support Coinz</a></li>
    <li><a href="#disclamer">Disclaimer</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About Coinz

[![Coinz Homepage](https://i.imgur.com/WGDERbT.png)](https://coinzbot.xyz)

Coinz is a Discord bot that brings a dynamic economy into your server. Engage your community with features that simulate real-world economic activities such as trading stocks and cryptocurrencies, managing a business, farming, and so much more. Coinz is designed to be a fun and interactive experience for users of all ages.

## Tech Stack

![Bun](https://img.shields.io/badge/bun-282a36?style=for-the-badge&logo=bun&logoColor=fbf0df)
![Turborepo](https://img.shields.io/badge/Turborepo-191327?style=for-the-badge&logo=turborepo&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![discord.js](https://img.shields.io/badge/discord.js-5765F2?style=for-the-badge&logo=discord&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=nextdotjs)
![Vercel](https://img.shields.io/badge/Vercel-black?style=for-the-badge&logo=vercel)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=prisma)
![NextAuth.js](https://img.shields.io/badge/NextAuth.js-black?style=for-the-badge&logo=nextdotjs)
![LemonSqueezy](https://img.shields.io/badge/Lemonsqueezy-5423E7.svg?logo=data:image/svg%2bxml;base64,PHN2ZyB3aWR0aD0iMjEiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyMSAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik02LjkyODgyIDE3LjE4NTZMMTQuNDQwMSAyMC42NTgzQzE1LjM3MTEgMjEuMDg4OSAxNi4wMjgyIDIxLjgxMTYgMTYuMzgzMSAyMi42NDA2QzE3LjI4MDcgMjQuNzM5OSAxNi4wNTM5IDI2Ljg4NjkgMTQuMTI4MSAyNy42NTkxQzEyLjIwMTkgMjguNDMwOSAxMC4xNDkxIDI3LjkzNDIgOS4yMTU2OCAyNS43NTExTDUuOTQ2NzcgMTguMDg2NkM1LjY5MzQ2IDE3LjQ5MjUgNi4zMjk4IDE2LjkwODcgNi45Mjg4MiAxNy4xODU2WiIgZmlsbD0iI0ZGQzIzMyIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTcuMzc5MDYgMTQuOTM3NkwxNS4xMzI3IDEyLjAwNjZDMTcuNzA5NiAxMS4wMzI1IDIwLjUyNDUgMTIuODc1NiAyMC40ODY1IDE1LjU1MzZDMjAuNDg1OSAxNS41ODg2IDIwLjQ4NTMgMTUuNjIzNSAyMC40ODQ0IDE1LjY1ODhDMjAuNDI4NyAxOC4yNjY2IDE3LjY5MjEgMjAuMDE5NCAxNS4xNzE4IDE5LjA5NjhMNy4zODY0IDE2LjI0NzNDNi43NjUzNiAxNi4wMjAxIDYuNzYwNzcgMTUuMTcxMyA3LjM3OTA2IDE0LjkzNzZaIiBmaWxsPSIjRkZDMjMzIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNi45NDQ5OSAxMy45MjI0TDE0LjU2NzEgMTAuNjgzN0MxNy4wOTk5IDkuNjA3MzYgMTcuNzQyNyA2LjM3Njk1IDE1Ljc1OSA0LjUxMDQzQzE1LjczMyA0LjQ4NTg1IDE1LjcwNyA0LjQ2MTU2IDE1LjY4MDcgNC40MzcyOEMxMy43MzU4IDIuNjMyMDcgMTAuNTIwOCAzLjI2NzY3IDkuNDEzNTggNS42NDUzOUw1Ljk5MzIzIDEyLjk5MTVDNS43MjAzMyAxMy41NzczIDYuMzM3MSAxNC4xODA2IDYuOTQ0OTkgMTMuOTIyNFoiIGZpbGw9IiNGRkMyMzMiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ljk4MzQ5IDEyLjY0MjZMNy43NTQ2NSA1LjA0NDE1QzguMDk4MjIgNC4xMDIgOC4wMzQ1OCAzLjE0MTIgNy42NzkzOSAyLjMxMjJDNi43Nzk5NCAwLjIxMzc4IDQuMzQ0MDkgLTAuNDYzNTc5IDIuNDE4NTMgMC4zMDk3NDFDMC40OTMyODQgMS4wODMzNiAtMC41OTQ2MjEgMi44NDAyOSAwLjM0MDYyMiA1LjAyMjUzTDMuNjMwOTUgMTIuNjc4N0MzLjg4NjEgMTMuMjcyIDQuNzYyNjEgMTMuMjQ4NiA0Ljk4MzQ5IDEyLjY0MjZaIiBmaWxsPSIjRkZDMjMzIi8+Cjwvc3ZnPgo=&style=for-the-badge)

## Features

-   Real-time financial data for stocks and cryptocurrencies.
-   In-depth business simulation allowing users to create and manage their own virtual businesses.
-   A comprehensive suite of games directly accessible within Discord.
-   Farming simulation where users can grow, harvest, and sell crops.
-   A virtual shop where users can purchase items to enhance their experience or trade with other players.

## Usage

To get started with Coinz:

1. [Invite the bot to your Discord server](https://coinzbot.xyz/invite).
2. Use the `/help` command in your server to see all available commands and features.

_To get started using Coinz, please refer to our [guides](https://coinzbot.xyz/guide)._

## Roadmap

-   [x] Rewrite code with functional programming principles
-   [ ] Add voting system
-   [ ] Add custom sharding stats
-   [ ] Work on fully automated CI/CD pipeline
-   [ ] Multi-language Support
    -   [ ] Dutch
    -   [ ] French
    -   [ ] Additional languages upon request

Visit the [roadmap](https://coinzbot.xyz/roadmap) for a full list of proposed features.

## Contributing

Want to contribute? Great, we love that! Please take your time on [opening a new issue](https://github.com/SiebeBaree/Coinz/issues/new).

### Developers

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Pull the latest changes from the original repository (`git pull upstream development`)
3. Create your Feature Branch (`git checkout -b feature/AmazingFeature development`)
4. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the Branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

### Users

You can still contribute without writing a single line of code! Here are some ways you can help:

-   **Reporting Bugs:** If you encounter a bug, please open an issue with the tag "bug" or open a post in our [support server](https://coinzbot.xyz/discord).
-   **Suggesting Features:** If you have an idea for a new feature, please open an issue with the tag "enhancement" or open a post in our [support server](https://coinzbot.xyz/discord).
-   **Coinz Premium:** Consider supporting the project by purchasing Coinz Premium. This will help us cover the costs of running the bot and allow us to continue developing new features. [Learn more](https://coinzbot.xyz/premium).

## Support Coinz

Coinz has started as a passion project but has developed way further than I ever imagined. To support this rappid growth please consider [buying premium](https://coinzbot.xyz/premium) or [donating](https://coinzbot.xyz/donate).

If you can't/don't want to donate anything, that's fine. You can also support Coinz by starring this repository. To make this bot even better consider opening a pull request or issue with a new feature.

## Disclaimer

-   You are not allowed to use the entire code of Coinz without making significant changes or improvements to the original code.
-   When using any part of this code, you are required to make your project open source, and provide proper credit and acknowledgement to the original project.
-   You are strictly prohibited from making any profit or monetizing projects that use this code, directly or indirectly.
-   Uploading this code to any service such as discordbotlist or top.gg is strictly forbidden. You are only allowed to host this bot for your community or utilize small portions of this code for your own public bot.

Please note that the author will **NOT** provide assistance in understanding or implementing the source code. It is your responsibility to understand and adapt the code as needed for your own project.

## License

We use the GNU GPLv3-license. If you plan to use any part of this source code in your own bot, we would be grateful if you would include some form of credit somewhere.

> You may copy, distribute and modify the software as long as you track changes/dates in source files. Any modifications to or software including (via compiler) GPL-licensed code must also be made available under the GPL along with build & install instructions.

Fetched from [TLDRLegal](<https://tldrlegal.com/license/gnu-general-public-license-v3-(gpl-3)>), please also read the [LICENSE.TXT](https://github.com/SiebeBaree/Coinz/blob/main/LICENSE) if you plan on using the source code. This is only a short summary. Please also take note of that we are not forced to help you, and we won't help you host it yourself as we do not recommend you doing so.

## Contact

Siebe Baree - [x.com/BareeSiebe](https://x.com/BareeSiebe) - [linkedin.com/siebe-baree](https://www.linkedin.com/in/siebe-baree/) - siebe.baree@outlook.com - `siebe_b` on Discord
