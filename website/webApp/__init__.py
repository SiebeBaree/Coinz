from flask import Flask
from dotenv import dotenv_values

config = dotenv_values()


def create_app():
    app = Flask(__name__)
    app.secret_key = config.get("APP_SECRET_KEY")

    from webApp.main.routes import main
    # from webApp.login.routes import login
    # from webApp.dashboard.routes import dashboard
    from webApp.errors.handlers import errors
    app.register_blueprint(main)
    # app.register_blueprint(login)
    # app.register_blueprint(dashboard, url_prefix="/dashboard")
    app.register_blueprint(errors)

    return app
