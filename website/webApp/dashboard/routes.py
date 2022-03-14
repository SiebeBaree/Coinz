from webApp.utils import is_authorized, is_guild_valid
from flask import render_template, session, redirect, url_for, Blueprint, abort

dashboard = Blueprint('dashboard', __name__)


@dashboard.route("/")
def dash():
    if not is_authorized():
        return redirect(url_for("login.login_page"))

    user = session.get("user")
    valid_guilds = session.get("valid")

    guilds = []
    index = -1
    for i, guild in enumerate(valid_guilds):
        if i % 3 == 0:
            index += 1
            guilds.append([])

        guilds[index].append(guild)

    return render_template('dashboard.html', title="Dashboard", logged_in=True, user=user, guilds=guilds)


@dashboard.route("/<guild_id>")
def dash_guild(guild_id):
    if not is_authorized():
        return redirect(url_for("login.login_page"))
    if not is_guild_valid(guild_id, session.get("valid")):
        return abort(403)

    user = session.get("user")

    guild = None
    for guild_obj in session.get('valid'):
        if guild_obj['id'] == guild_id:
            guild = guild_obj
            break

    if guild is None:
        return abort(404)

    return render_template('dashboard_guild.html', title="Dashboard", logged_in=True, user=user, guild=guild)
