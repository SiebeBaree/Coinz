from webApp import config
from flask import render_template, session, redirect, Blueprint

main = Blueprint('main', __name__)


@main.route("/")
def index():
    logged_in = "token" in session
    user = session.get('user')
    return render_template("index.html", logged_in=logged_in, user=user)


@main.route("/terms-of-service")
@main.route("/tos")
def terms_of_service():
    logged_in = "token" in session
    user = session.get('user')
    return render_template("terms_of_service.html", logged_in=logged_in, user=user)


@main.route("/privacy-policy")
def privacy_policy():
    logged_in = "token" in session
    user = session.get('user')
    return render_template("privacy_policy.html", logged_in=logged_in, user=user)


@main.route("/faq")
def faq():
    logged_in = "token" in session
    user = session.get('user')
    return render_template("faq.html", logged_in=logged_in, user=user)


@main.route("/commands")
def commands():
    logged_in = "token" in session
    user = session.get('user')
    return render_template("commands.html", logged_in=logged_in, user=user)


@main.route("/invite")
@main.route("/invite/<guild_id>")
def invite(guild_id=None):
    url = f"https://discord.com/api/oauth2/authorize?client_id={config.get('DISCORD_CLIENT_ID')}&permissions=313344&scope=bot%20applications.commands"

    if guild_id is not None:
        url += f"&guild_id={guild_id}"

    return redirect(url)


@main.route("/donate")
@main.route("/premium")
def donate():
    return redirect("https://patreon.com/join/coinz_bot")


@main.route("/discord")
@main.route("/support")
def discord():
    return redirect("https://discord.gg/asnZQwc6kW")


@main.route("/ban-appeal")
def ban_appeal():
    return redirect("https://google.com/")


@main.route("/report-user")
def report_user():
    return redirect("https://google.com/")
