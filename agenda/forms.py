
from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from flask_login import current_user
from wtforms import StringField, PasswordField, SubmitField, BooleanField, SelectField, SelectMultipleField, widgets, TextAreaField, DateField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError, Regexp
from agenda.models import Usuarios
from agenda import MASTER_KEY

from datetime import datetime

class LoginForm(FlaskForm):
    username = StringField('Nome do Usuário',
                            validators=[DataRequired("Campo Obrigatório"),
                                        Length(2, 20, "O nome do usuário deve ter entre 2 e 20 carácteres")])
    password = PasswordField('Senha',
                              validators=[DataRequired("Campo Obrigatório"),
                                          Length(6, message="A senha deve ter no mínimo 6 dígitos")])
    remember = BooleanField('Mantenha-me conectado')
    submit = SubmitField('Entrar')

class RegistrationForm(FlaskForm):
    def validate_username(self, username):
        user = Usuarios.query.filter_by(usuario=username.data).first()

        if(user):
            raise ValidationError('Usuário já cadastrado')
    
    def validate_email(self, email):
        user = Usuarios.query.filter_by(email=email.data).first()

        if(user):
            raise ValidationError('Este e-mail já está cadastrado em outro usuário')

    username = StringField('Nome',
                            validators=[DataRequired("Campo Obrigatório"),
                                        Length(2, 20, "O nome do usuário deve ter entre 2 e 20 carácteres")])
    email = StringField('E-mail',
                         validators=[DataRequired("Campo Obrigatório"),
                                     Email("Digite um formato válido de e-mail")])
    telephone = StringField('Celular')
    password = PasswordField('Senha',
                              validators=[DataRequired("Campo Obrigatório"),
                                          Length(6, message="A senha deve ter no mínimo 6 dígitos")])
    confirm_password = PasswordField('Corfirmar Senha',
                                      validators=[DataRequired("Campo Obrigatório"),
                                                  EqualTo('password', "As senhas são diferentes")])
    level = SelectField('Nível')
    technicians = SelectField('Técnico')
    submit = SubmitField('Salvar')

class UsersForm(FlaskForm):
    def validate_username(self, username):
        if('_' in username.data):
            username.data = ' '.join(username.data.split('_'))
        
        user = Usuarios.query.filter_by(usuario=username.data).first()

        if(user):
            raise ValidationError('Usuário já cadastrado')
    
    def validate_email(self, email):
        user = Usuarios.query.filter_by(email=email.data).first()

        if(user):
            raise ValidationError('E-mail já cadastrado')

    users = SelectField('Usuários Cadastrados')
    level = SelectField('Nível')
    username = StringField('Nome',
                            validators=[DataRequired("Campo Obrigatório"),
                                        Length(2, 20, "O nome do usuário deve ter entre 2 e 20 carácteres")])
    email = StringField('E-mail',
                         validators=[DataRequired("Campo Obrigatório"),
                                     Email("Digite um formato válido de e-mail")])
    telephone = StringField('Celular')
    password = PasswordField('Senha',
                              validators=[DataRequired("Campo Obrigatório"),
                                          Length(6, message="A senha deve ter no mínimo 6 dígitos")])
    confirm_password = PasswordField('Corfirmar Senha',
                                      validators=[DataRequired("Campo Obrigatório"),
                                                  EqualTo('password', "As senhas são diferentes")])

class MasterKeyForm(FlaskForm):
    def validate_master_key(self, master_key):
        if(master_key.data != MASTER_KEY):
            raise ValidationError('Senha Errada')

    master_key = PasswordField('Master Key',
                                validators=[DataRequired("Campo Obrigatório")])

class DatabaseResetForm(MasterKeyForm):
    submit = SubmitField('Refazer')

class NewMasterForm(MasterKeyForm):
    def validate_username(self, username):
        user = Usuarios.query.filter_by(usuario=username.data).first()

        if(user):
            raise ValidationError('Usuário já cadastrado')
    
    def validate_email(self, email):
        user = Usuarios.query.filter_by(email=email.data).first()

        if(user):
            raise ValidationError('Este e-mail já está cadastrado em outro usuário')

    username = StringField('Nome',
                            validators=[DataRequired("Campo Obrigatório"),
                                        Length(2, 20, "O nome do usuário deve ter entre 2 e 20 carácteres")])
    email = StringField('E-mail',
                         validators=[DataRequired("Campo Obrigatório"),
                                     Email("Digite um formato válido de e-mail")])
    telephone = StringField('Celular')
    password = PasswordField('Senha',
                              validators=[DataRequired("Campo Obrigatório"),
                                          Length(6, message="A senha deve ter no mínimo 6 dígitos")])
    confirm_password = PasswordField('Corfirmar Senha',
                                      validators=[DataRequired("Campo Obrigatório"),
                                                  EqualTo('password', "As senhas são diferentes")])
    submit = SubmitField('Salvar')

class RequestResetPasswordForm(FlaskForm):
    def validate_email(self, email):
        user = Usuarios.query.filter_by(email=email.data).first()

        if(not user):
            raise ValidationError("E-mail não cadastrado")

    email = StringField('E-mail',
                         validators=[DataRequired("Campo Obrigatório"),
                                     Email("Digite um formato válido de e-mail")])
    submit = SubmitField('Enviar')

class ResetPasswordForm(FlaskForm):
    password = PasswordField('Senha',
                              validators=[DataRequired("Campo Obrigatório"),
                                          Length(6, message="A senha deve ter no mínimo 6 dígitos")])
    confirm_password = PasswordField('Corfirmar Senha',
                                      validators=[DataRequired("Campo Obrigatório"),
                                                  EqualTo('password', "As senhas são diferentes")])
    submit = SubmitField('Redefinir Senha')

class ServicesForm(FlaskForm):
    class _MultiCheckBoxField(SelectMultipleField):
        widget = widgets.ListWidget(html_tag='ol', prefix_label=True)
        option_widget = widgets.CheckboxInput()
    
    class _CheckboxValidatorAtLeastOneSelected():
        def __init__(self, message=None):
            if(not message):
                message = "At least one option must be selected"
            self.message = message
        
        def __call__(self, form, field):
            if(len(field.data) == 0):
                raise ValidationError(self.message)

    # def validate_date(self, _):
    #     now = datetime.date(datetime.now())

    #     if(self.date.data < now):
    #         raise ValidationError('Data Indisponível')
    
    # def validate_group_date_first(self, _):
    #     now = datetime.date(datetime.now())

    #     if(self.group_date_first.data < now):
    #         raise ValidationError('Data Indisponível')

    def validate_group_date_last(self, _):
        if(self.group_date_last.data < self.group_date_first.data):
            raise ValidationError('A Data Final deve ser posterior a Data Inicial')

    services = SelectField('Serviços')
    title = StringField('Título', validators=[DataRequired("Campo Obrigatório"), Length(2, 60, "O título do serviço deve ter entre 2 e 60 carácteres")])
    date = DateField('Data', validators=[DataRequired("Campo Obrigatório")])
    group_date_first = DateField('Data Inicial', validators=[DataRequired("Campo Obrigatório")])
    group_date_last = DateField('Data Final', validators=[DataRequired("Campo Obrigatório")])
    service_repeat = BooleanField('Repetir Serviço')
    address = StringField('Endereço', validators=[Length(max=300)])
    os = StringField('Ordem de Serviço', validators=[Length(max=9)])
    equipment = StringField('Equipamento', validators=[Length(max=100)])
    serial_number = StringField('Nº de Série', validators=[Length(max=30)])
    description = TextAreaField('Descrição do Serviço', validators=[Length(max=671)])
    technicians = _MultiCheckBoxField('Técnicos',
                                    #    validators=[_CheckboxValidatorAtLeastOneSelected("Escolha pelo menos 1 técnico"),
                                    #                DataRequired(message="Escolha uma opção válida")],
                                       coerce=int)
