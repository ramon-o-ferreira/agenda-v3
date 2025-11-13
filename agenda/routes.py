from agenda import server, database, bcrypt, Nivel, GOOGLE_API_KEY
from agenda.forms import LoginForm, RegistrationForm, ServicesForm, RequestResetPasswordForm, ResetPasswordForm, NewMasterForm, DatabaseResetForm
from agenda.models import Usuarios, Servicos
from agenda.tools import get_schedule_table, get_services_form, get_users_form, get_registration_form, send_email, send_html_email, generate_email_message_for_service
from flask import render_template, request, url_for, redirect, abort, flash
from flask_login import login_user, logout_user, current_user, login_required, login_remembered
from flask_wtf.csrf import generate_csrf

from json import dumps, loads
from datetime import datetime

from urllib.parse import quote_plus

@server.route("/login", methods=['GET', 'POST'])
def login():
    if(current_user.is_authenticated):
        flash(f"Você já está logado como {current_user.usuario}", "success")
        return redirect(url_for('home'))

    form = LoginForm()
    if(form.validate_on_submit()):
        user = Usuarios.query.filter_by(usuario=form.username.data).first()
        if(user and bcrypt.check_password_hash(user.senha, form.password.data)):
            login_user(user, remember=form.remember.data)
            return_page = request.args.get('next')
            next_page = return_page if return_page else 'home'
            
            return redirect(next_page)
        else:
            flash(f"Usuário ou senha inválido", "danger")
    
    return render_template('login.html', title="Entrar", form=form)

@server.route("/reset_password/", methods=['GET', 'POST'])
@server.route("/reset_password", methods=['GET', 'POST'])
def forgot_password():
    if(current_user.is_authenticated):
        flash(f"Você já está logado como {current_user.usuario}", "success")
        return redirect(url_for('home'))

    form = RequestResetPasswordForm()
    if(form.validate_on_submit()):
        user = Usuarios.query.filter_by(email=form.email.data).first()
        token = user.get_password_reset_token()
        password_reset_link = url_for('reset_password', token=token, _external=True).replace("http://", "https://")
        mail_message = f"Link para redefinição de Senha:\n\n{password_reset_link}"
        send_email(to=user.email, subject="Redefinição de Senha", message=mail_message)

        flash(f'E-mail de recuperação de senha enviado para "{user.email}"', "success")

    return render_template('forgot_password.html', title="Esqueci Minha Senha", form=form)

@server.route("/reset_password/<token>", methods=['GET', 'POST'])
def reset_password(token):
    if(not token):
        return redirect(url_for('forgot_password'))

    if(current_user.is_authenticated):
        flash(f"Você já está logado como {current_user.usuario}", "success")
        return redirect(url_for('home'))

    user = Usuarios.verify_password_reset_token(token)
    if(not user):
        flash("URL de redefinição de senha inválida ou expirada", "warning")
        return redirect(url_for('forgot_password'))

    form = ResetPasswordForm()
    if(form.validate_on_submit()):
        # print("Validou o Formulário")
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        user.senha = hashed_password
        database.session.commit()
        flash("Senha alterada", "success")
        return redirect(url_for('login'))
    
    return render_template('reset_password.html', title="Redefinição de Senha", form=form)

@server.route("/", methods=['GET', 'POST'])
@server.route("/home", methods=['GET', 'POST'])
@login_required
def home():
    if(Usuarios.query.filter_by(nivel=Nivel.TECNICO.name).first()):
        now = datetime.fromisoformat(request.args.get("date")) if request.args.get("date") else datetime.now()
        schedule_table = get_schedule_table(now=now)
        service_form = get_services_form()
        
        flash(f"Bem Vindo(a), {current_user.usuario}", "dark")
        return render_template('home.html', title="Home", service_form=service_form, schedule=schedule_table)
    else:
        return render_template('schedule_warning.html', title='Agenda - Aviso')

@server.route("/users")
@login_required
def users():
    if(current_user.nivel.value <= Nivel.ADMIN.value):
        form = get_users_form()
        return render_template('users.html', title='Usuários', users_form=form)
    else:
        abort(404)

@server.route("/services")
@login_required
def services():
    if(current_user.nivel.value <= Nivel.GERENTE.value):
        form = get_services_form()

        return render_template('services.html', title='Serviços', service_form=form)
        # if(Usuarios.query.filter_by(nivel=Nivel.TECNICO.name).first()):
        #     return render_template('services.html', title='Serviços', service_form=form)
        # else:
        #     return render_template('services_warning.html', title='Serviços - Aviso')
    else:
        abort(404)

@server.route("/whatsapp")
@login_required
def whatsapp_qrcode():
    if(current_user.nivel.value <= Nivel.ADMIN.value):
        return render_template('whatsapp_qrcode.html', title='Whatsapp')
    else:
        abort(404)

@server.route("/manuals")
@login_required
def technical_manuals():
    if(current_user.nivel.name == Nivel.TECNICO.name):
        return render_template('technical_manuals.html', title='Manuals')
    else:
        abort(404)

@server.route("/logout")
def logout():
    logout_user()
    flash("Até a próxima!", 'success')
    return redirect(url_for('login'))

@server.route("/google_api_key")
def google_api_key():
    if(current_user.is_authenticated):
        return GOOGLE_API_KEY
    else:
        abort(404)
        # return '<h1>¯\\_(ツ)_/¯ "Sorry, you are not logged in!"</h1>'
        # return "( ͡⚆ ͜ʖ ͡⚆)╭∩╮"
        # return "(ง'̀-'́)ง"
        # return "( • )( • ) ԅ(‾⌣‾ԅ)"

@server.route("/master/new_master", methods=['GET', 'POST'])
def new_master():
    master_users = None
    try:
        master_users = Usuarios.query.filter_by(nivel=Nivel.MASTER.name).all()
        print("Tabela Usuários Existe")
        if(master_users):
            print("Há usuários MASTER")
        else:
            print("Não há usuários MASTER")
    except:
        print("Tabela Usuários não foi criada")
        abort(404)
    
    if(master_users):
        abort(404)

    else:
        form = NewMasterForm()
        if(form.validate_on_submit()):
            hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
            user = Usuarios(usuario=form.username.data, email=form.email.data, celular=form.telephone.data, senha=hashed_password, nivel=Nivel.MASTER.name)
            database.session.add(user)
            database.session.commit()

            flash(f'Primeira conta "MASTER" criada', 'success')
            return redirect(url_for('login'))

        return render_template('register_new_master.html', title='Criar MASTER', form=form)

@server.route("/master/reset_database", methods=['GET', 'POST'])
def reset_database():
    table_users_is_created = False
    table_users_has_entries = False
    table_services_is_created = False
    table_services_has_entries = False
    
    users = None
    try:
        users = Usuarios.query.order_by(Usuarios.id).all()
        table_users_is_created = True
        print("Tabela Usuários já existe")
        if(users):
            table_users_has_entries = True
            print("Tabela Usuários em uso")
        else:
            print("Tabela Usuários vazia")
    except:
        print("Tabela Usuários não foi criada")
    
    services = None
    try:
        services = Servicos.query.order_by(Servicos.id).all()
        table_services_is_created = True
        print("Tabela Servicos já existe")
        if(services):
            table_services_has_entries = True
            print("Tabela Serviços em uso")
        else:
            print("Tabela Serviços vazia")
    except:
        print("Tabela Servicos não foi criada")

    if(current_user.is_authenticated):
        logout_user()

    database.session.close()

    if(table_users_is_created or table_services_is_created):
        print("Há tabelas em uso. Abortando...")
        abort(404)
    
    form = DatabaseResetForm()
    if(form.validate_on_submit()):
        database.create_all()
        print("Tabelas Refeitas!")
        return redirect(url_for('new_master'))
    
    return render_template('reset_database.html', title='Redefinir Banco de Dados', form=form)