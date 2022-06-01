# Coinz Website
## Suggestions, bugs, feature requests

Want to contribute? Great, we love that! Please take your time on [opening a new issue](https://github.com/SiebeBaree/Coinz/issues/new).

## Support Coinz
If you really like this bot, consider donating to Coinz on Ko-fi.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/J3J54IS5U)

If you can't/don't want to donate, that's fine. You can also support Coinz by starring or forking this repository. To make this bot even better consider opening a pull request or issue with a new feature.

## Self-Hosting
We do not recommend self-hosting the bot and website, but it's always an option.

To selfhost the website yourself, you need to have:
* Python - confirmed working on v3.9.10
* pip - comes with Python, the version shouldn't really matter (at least 2.x)
* OAuth2 Redirects setup (You can find the OAuth2 tab in your discord application)
* All packages installed (List of all packages in `/website/requirements.txt`)
* A clone of the source code, this can be found [here](https://github.com/SiebeBaree/Coinz) and needs to be extracted to a folder.

We will have to do this once:
* Create a file in `website/` named `.env`.
* Change `website/.env` with your values.

**OAuth2 Redirects:**
```
https://www.your-website-here.com/callback
https://www.your-website-here.com/dashboard
```

**Example website/.env file:** *(Do not use `""` or `''`)*
```
APP_SECRET_KEY=
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_SECRET=
DISCORD_CLIENT_ID=
```

After all this, run `python3 website/coinzbot.py`.

> ### ⚠ Warning 
> There is literally no warranty if you self-host Coinz, and we will not help you set it up either. If you wish to set the bot and/or website up yourself, we expect you have well enough knowledge in Python, Flask, HTML/CSS, Mongodb, ... .

## License
We use the GNU GPLv3-license. If you plan to use any part of this source code in your own bot, we would be grateful if you would include some form of credit somewhere.

> You may copy, distribute and modify the software as long as you track changes/dates in source files. Any modifications to or software including (via compiler) GPL-licensed code must also be made available under the GPL along with build & install instructions.

Fetched from [TLDRLegal](https://tldrlegal.com/license/gnu-general-public-license-v3-(gpl-3)), please also read the [license](https://github.com/SiebeBaree/Coinz/blob/main/LICENSE) if you plan on using the source code. This is only a short summary. Please also take note of that we are not forced to help you, and we won't help you host it yourself as we do not recommend you doing so.