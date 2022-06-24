from webApp import config
from webApp.utils import is_authorized
from flask import render_template, session, redirect, Blueprint, abort

main = Blueprint('main', __name__)


@main.route("/")
def index():
    logged_in = is_authorized()  # "token" in session
    user = session.get('user')
    return render_template("index.html", logged_in=logged_in, user=user)


@main.route("/donate")
def donate():
    return redirect("https://ko-fi.com/coinz")


@main.route("/discord")
def discord():
    return redirect("https://discord.gg/asnZQwc6kW")


@main.route("/invite")
@main.route("/invite/<guild_id>")
def invite(guild_id=None):
    # session.pop("guilds", None)
    url = f"https://discord.com/api/oauth2/authorize?client_id={config.get('DISCORD_CLIENT_ID')}&permissions=313344&scope=bot%20applications.commands"

    if guild_id is not None:
        url += f"&guild_id={guild_id}"

    return redirect(url)


@main.route("/terms-of-service")
@main.route("/tos")
def terms_of_service():
    logged_in = "token" in session
    return render_template("terms_of_service.html", logged_in=logged_in)


@main.route("/privacy-policy")
def privacy_policy():
    logged_in = "token" in session
    return render_template("privacy_policy.html", logged_in=logged_in)


@main.route("/vote")
def vote():
    return abort(404)
