from webApp.utils import is_authorized
from flask import render_template, session, redirect, url_for, Blueprint

dashboard = Blueprint('dashboard', __name__)


@dashboard.route("/")
def premium():
    if not is_authorized():
        return redirect(url_for("login.login_page"))
    return "Hello World"
