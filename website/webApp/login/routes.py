from requests.exceptions import HTTPError
from webApp.oauth2 import Oauth2
from webApp.utils import clear_session
from flask import session, request, redirect, url_for, Blueprint

login = Blueprint('login', __name__)


@login.route("/login")
def login_page():
    if "token" in session:
        return redirect(url_for("dashboard.dash"))
    return redirect(Oauth2.LOGIN_URI)


@login.route("/callback")
def callback():
    try:
        token = Oauth2.exchange_code(request.args.get("code"))
        session["token"] = token.get("access_token")
    except HTTPError:
        clear_session()
        return redirect(url_for("login.login_page"))
    return redirect(url_for("dashboard.dash"))


@login.route("/logout")
def logout():
    clear_session()
    return redirect(url_for("main.index"))
