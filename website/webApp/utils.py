from requests.exceptions import HTTPError
from flask import session
from webApp.oauth2 import Oauth2


def clear_session():
    session.pop("token", None)
    session.pop("user", None)
    session.pop("guilds", None)


def is_authorized():
    if "token" not in session:
        clear_session()
        return False
    token = session.get("token")

    try:
        if "user" not in session:
            session["user"] = Oauth2.get_user_data(token)

        if "guilds" not in session:
            session["guilds"] = Oauth2.get_guild_data(token)

        if "bot_guilds" not in session:
            session["bot_guilds"] = Oauth2.get_bot_guilds()
            session["valid"] = get_valid_guilds(session.get("guilds"), session["bot_guilds"])

        if "valid" not in session:
            session["valid"] = get_valid_guilds(session.get("guilds"), session["bot_guilds"])
    except HTTPError:
        clear_session()
        return False
    return True


def get_valid_guilds(guilds, bot_guilds):
    return [guild for guild in guilds if guild['id'] in map(lambda i: i['id'], bot_guilds) and (int(guild['permissions']) & 0x8) == 0x8]


def is_guild_valid(guild_id, valid):
    return True if guild_id in map(lambda i: i['id'], valid) else False
