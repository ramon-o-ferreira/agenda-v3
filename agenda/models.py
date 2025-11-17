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

class Vendors(database.Model, UserMixin):
    __tablename__ = "vendors"

    id = database.Column(database.Integer, primary_key=True)
    name = database.Column(database.String(20), unique=True, nullable=False)
    
    type = database.relationship("Types", back_populates="vendor")
    
    def __repr__(self):
        return f"Vendor: ('{self.name}')"

class Types(database.Model, UserMixin):
    __tablename__ = "types"

    id = database.Column(database.Integer, primary_key=True)
    name = database.Column(database.String(50), unique=False, nullable=False)
    
    vendor_id = database.Column(database.Integer, database.ForeignKey('vendors.id'))
    vendor = database.relationship("Vendors", back_populates="type")

    model = database.relationship("Models", back_populates="type")
    
    def __repr__(self):
        return f"Type: ('{self.name}')"

class Models(database.Model, UserMixin):
    __tablename__ = "models"

    id = database.Column(database.Integer, primary_key=True)
    name = database.Column(database.String(50), unique=True, nullable=False)
    
    type_id = database.Column(database.Integer, database.ForeignKey('types.id'))
    type = database.relationship("Types", back_populates="model")

    section = database.relationship("Sections", back_populates="model")
    
    def __repr__(self):
        return f"Model: ('{self.name}')"

class Sections(database.Model, UserMixin):
    __tablename__ = "sections"

    id = database.Column(database.Integer, primary_key=True)
    name = database.Column(database.String(50), unique=False, nullable=False)
    
    model_id = database.Column(database.Integer, database.ForeignKey('models.id'))
    model = database.relationship("Models", back_populates="section")

    manual = database.relationship("Manuals", back_populates="section")
    
    def __repr__(self):
        return f"Section: ('{self.name}')"

class Manuals(database.Model, UserMixin):
    __tablename__ = "manuals"

    id = database.Column(database.Integer, primary_key=True)
    data = database.Column(database.String, unique=False, nullable=False)
    
    section_id = database.Column(database.Integer, database.ForeignKey('sections.id'))
    section = database.relationship("Sections", back_populates="manual")

    def __repr__(self):
        return f"Manual: ('{self.name}')"