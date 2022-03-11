import requests
from webApp import config


class Oauth2:
    API_ENDPOINT = "https://discord.com/api/v10"
    CLIENT_ID = config.get("DISCORD_CLIENT_ID")
    CLIENT_SECRET = config.get("DISCORD_CLIENT_SECRET")
    REDIRECT_URI = "http://127.0.0.1:5000/callback"
    SCOPE = "identify%20guilds"
    LOGIN_URI = f"{API_ENDPOINT}/oauth2/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope={SCOPE}&prompt=consent"

    @staticmethod
    def exchange_code(code):
        data = {
            'client_id': Oauth2.CLIENT_ID,
            'client_secret': Oauth2.CLIENT_SECRET,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': Oauth2.REDIRECT_URI
        }
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        r = requests.post('%s/oauth2/token' % Oauth2.API_ENDPOINT, data=data, headers=headers)
        r.raise_for_status()
        return r.json()

    @staticmethod
    def refresh_token(refresh_token: str):
        data = {
            'client_id': Oauth2.CLIENT_ID,
            'client_secret': Oauth2.CLIENT_SECRET,
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token
        }
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        r = requests.post('%s/oauth2/token' % Oauth2.API_ENDPOINT, data=data, headers=headers)
        r.raise_for_status()
        print(r.json())
        return r.json()

    @staticmethod
    def get_token():
        data = {
            'grant_type': 'client_credentials',
            'scope': 'identify connections'
        }
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        r = requests.post('%s/oauth2/token' % Oauth2.API_ENDPOINT, data=data, headers=headers, auth=(Oauth2.CLIENT_ID, Oauth2.CLIENT_SECRET))
        r.raise_for_status()
        print(r.json())
        return r.json()

    @staticmethod
    def revoke_token(token: str):
        data = {
            'client_id': Oauth2.CLIENT_ID,
            'client_secret': Oauth2.CLIENT_SECRET,
            'token': token
        }
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        r = requests.post('%s/oauth2/token/revoke' % Oauth2.API_ENDPOINT, data=data, headers=headers)
        r.raise_for_status()
        return r.json()

    @staticmethod
    def get_user_data(token):
        headers = {
            'Authorization': f'Bearer {token}'
        }
        r = requests.get('%s/users/@me' % Oauth2.API_ENDPOINT, headers=headers)
        r.raise_for_status()
        return r.json()

    @staticmethod
    def get_guild_data(token):
        headers = {
            'Authorization': f'Bearer {token}'
        }
        r = requests.get('%s/users/@me/guilds' % Oauth2.API_ENDPOINT, headers=headers)
        r.raise_for_status()
        return r.json()

    @staticmethod
    def get_bot_guilds():
        headers = {
            'Authorization': f'Bot {config.get("DISCORD_BOT_TOKEN")}'
        }
        r = requests.get('%s/users/@me/guilds' % Oauth2.API_ENDPOINT, headers=headers)
        r.raise_for_status()
        return r.json()
