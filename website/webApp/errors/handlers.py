from flask import render_template, Blueprint

errors = Blueprint('errors', __name__)


@errors.app_errorhandler(403)
def error_403(error):
    return render_template('errors/403.html', title="403 - Forbidden"), 403


@errors.app_errorhandler(404)
def error_404(error):
    return render_template('errors/404.html', title="404 - Not Found"), 404


@errors.app_errorhandler(500)
def error_500(error):
    return render_template('errors/500.html', title="500 - Server Error"), 500
