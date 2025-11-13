from agenda import database, login_manager, Nivel, server
from flask_login import UserMixin
from sqlalchemy import Enum as database_enum
from itsdangerous import URLSafeSerializer as Serializer

from datetime import datetime, timedelta

@login_manager.user_loader
def load_user(user_id):
    return Usuarios.query.get(int(user_id))

class Usuarios(database.Model, UserMixin):
    __tablename__ = "usuarios"

    id = database.Column(database.Integer, primary_key=True)
    usuario = database.Column(database.String(20), unique=True, nullable=False)
    email = database.Column(database.String(120), unique=True, nullable=False)
    senha = database.Column(database.String(60), unique=False, nullable=False)
    celular = database.Column(database.String(11), unique=False, nullable=True)
    nivel = database.Column(database_enum(Nivel), unique=False, nullable=False)

    def get_password_reset_token(self, expiration_time=0.5):
        auth = Serializer(server.config["SECRET_KEY"], "password_reset")
        return auth.dumps(({'id': self.id}, int(datetime.now().timestamp()) + timedelta(hours=float(expiration_time)).seconds))
    
    @staticmethod
    def verify_password_reset_token(token):
        auth = Serializer(server.config["SECRET_KEY"], "password_reset")
        try:
            user, expiration_date = auth.loads(token)
            if(int(datetime.now().timestamp()) <= int(expiration_date)):
                return Usuarios.query.filter_by(id = user["id"]).first()
            else:
                return None
        except:
            return None

    def __repr__(self):
        return f"Usuários: ('{self.usuario}', '{self.email}')"

class Servicos(database.Model, UserMixin):
    __tablename__ = "servicos"

    id = database.Column(database.Integer, primary_key=True)
    os = database.Column(database.String(10), unique=False, nullable=True)
    titulo = database.Column(database.String(60), unique=False, nullable=False)
    data = database.Column(database.Date, nullable=False)
    endereco = database.Column(database.String(300), unique=False, nullable=False)
    equipamento = database.Column(database.String(100), unique=False, nullable=True)
    serial = database.Column(database.String(30), unique=False, nullable=True)
    descricao = database.Column(database.String(671), unique=False, nullable=True)
    tecnicos = database.Column(database.ARRAY(database.Integer), nullable=True)
    grupo = database.Column(database.String(32), nullable=True)
    email_enviado = database.Column(database.Boolean, default=False)
    
    def __repr__(self):
        return f"Serviços: ('{self.titulo}', '{self.data}', '{self.os}')"