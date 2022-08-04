from requests.exceptions import HTTPError
from flask import session
from webApp.oauth2 import Oauth2


def clear_session():
    session.pop("token", None)
    session.pop("user", None)
    session.pop("guilds", None)
    session.pop("bot_guilds", None)


def is_authorized():
    if "token" not in session:
        clear_session()
        return False
    token = session.get("token")

    try:
        if "user" not in session:
            session["user"] = Oauth2.get_user_data(token)
    except HTTPError:
        clear_session()
        return False
    return True
