from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_mail import Mail

from redis import from_url

from os import environ
from enum import Enum

class Nivel(Enum):
    MASTER = 0
    ADMIN = 1
    GERENTE = 2
    TECNICO = 3
    #CLIENTE = 4

GOOGLE_API_KEY = environ.get("GOOGLE_MAPS_API_KEY")
WHATSAPP_API_KEY = environ.get("WHATSAPP_API_KEY")
MASTER_KEY = environ.get("MASTER_KEY")
REDISCLOUD_URL = environ.get("REDISCLOUD_URL")

DATABASE_URL = environ.get("DATABASE_URL")
server = Flask(__name__)
server.config["SECRET_KEY"] = environ.get("SECRET_KEY")
server.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL if("postgresql://" in DATABASE_URL) else DATABASE_URL.replace("postgres://", "postgresql://")
server.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
server.jinja_env.cache = {}

server.config["MAIL_USERNAME"] = environ.get("MAIL_USERNAME")
server.config["MAIL_PASSWORD"] = environ.get("MAIL_PASSWORD")
server.config["MAIL_SERVER"] = environ.get("MAIL_SERVER")
server.config["MAIL_PORT"] = int(environ.get("MAIL_PORT"))
server.config["MAIL_USE_SSL"] = True if environ.get("MAIL_USE_SSL") == "True" else False
server.config["MAIL_USE_TLS"] = True if environ.get("MAIL_USE_TLS") == "True" else False
server.config["MAIL_DEBUG"] = True if environ.get("MAIL_DEBUG") == "True" else False
server.config["MAIL_DEFAULT_SENDER"] = server.config["MAIL_USERNAME"]
mail = Mail(server)

database = SQLAlchemy(server)

bcrypt = Bcrypt(server)

login_manager = LoginManager(server)
login_manager.login_view = "login"
login_manager.login_message = "Faça o login para acessar essa página"
login_manager.login_message_category = "info"

queue = from_url(f"{REDISCLOUD_URL}/services_queue")

from agenda import api
from agenda import routes