import requests
from requests.structures import CaseInsensitiveDict
from requests.exceptions import HTTPError
from webApp import config
from webApp.oauth2 import Oauth2
from webApp.utils import clear_session
from flask import session, request, redirect, url_for, Blueprint, abort

login = Blueprint('login', __name__)


@login.route("/login")
def login_page():
    if "token" in session:
        return redirect(url_for("main.index"))
    return redirect(Oauth2.LOGIN_URI)


@login.route("/callback")
def callback():
    try:
        token = Oauth2.exchange_code(request.args.get("code"))
        session["token"] = token.get("access_token")
    except HTTPError:
        clear_session()
        return redirect(url_for("login.login_page"))
    return redirect(url_for("main.index"))


@login.route("/logout")
def logout():
    clear_session()
    return redirect(url_for("main.index"))


@login.route("/patreon-login")
def patreon_login():
    return redirect(f"https://www.patreon.com/oauth2/authorize?response_type=code&client_id={config.get('PATREON_CLIENT_ID')}&redirect_uri={config.get('PATREON_REDIRECT_URI')}&scope=identity+identity%5Bemail%5D")


@login.route("/patreon-callback")
def patreon_callback():
    if request.args.get('code') is None:
        return abort(400)

    data = {
        "code": request.args.get('code'),
        "grant_type": 0,
        "client_id": "",
        "client_secret": "",
        "redirect_uri": ""
    }

    headers = CaseInsensitiveDict()
    headers["Content-Type"] = "application/x-www-form-urlencoded"

    resp = requests.post("www.patreon.com/api/oauth2/v2/token", data=data, headers=headers)
    return "hello"

    # headers = CaseInsensitiveDict()
    # # headers["accept"] = "application/json"
    # headers["authorization"] = f"Bearer {request.args.get('code')}"
    #
    # resp = requests.get(f"https://www.patreon.com/api/oauth2/v2/identity?fields[user]=about,created,email,first_name,full_name,image_url,last_name,social_connections,thumb_url,url,vanity", headers=headers)
    # return resp.json()
