from agenda import server, database, bcrypt, Nivel, WHATSAPP_API_KEY
from agenda.models import Usuarios, Servicos
from agenda.tools import get_services_form, get_users_form, get_effort_description, generate_email_message_for_service, send_html_email, queue_whatsapp_messages_tasks, get_whatsapp_messages_tasks, queue_whatsapp_qrcodes_tasks, get_whatsapp_qrcodes_tasks, get_whatsapp_task_response, queue_whatsapp_task_response, queue_whatsapp_disconnect, get_whatsapp_disconnect

from flask import request, abort
from flask_login import current_user
from flask_wtf.csrf import validate_csrf

from json import dumps
from binascii import b2a_hex
from os import urandom
from datetime import datetime
from dateutil.relativedelta import relativedelta as timedelta

from urllib.parse import quote

@server.route("/api/users", methods=['GET', 'POST', 'PUT', 'DELETE'])
def users_api():
    if(current_user.is_authenticated):
        response = dict()
        if(request.method == "GET" and current_user.nivel.value <= 3):
            if(current_user.nivel.name == "TECNICO"):
                users = Usuarios.query.filter_by(nivel = Nivel.TECNICO).order_by(Usuarios.usuario).all()

                response = {"users": list()}
                for user in users:
                    response["users"].append({
                        "id": user.id,
                        "level": user.nivel.name,
                        "username": user.usuario,
                        "email": user.email,
                        "telephone": user.celular
                    })

                return dumps(response)

            level = request.args.get("level")
            if(level):
                level = level.upper()
                isValid = False
                for nivel in Nivel:
                    if(level == nivel.name):
                        isValid = True
                        break
                
                if(not isValid):
                    response["status"] = "error"
                    response["message"] = "level_not_valid"
                    return dumps(response)
                
                if(Nivel[level].value < current_user.nivel.value):
                    response["status"] = "error"
                    response["message"] = "not_allowed"
                    return dumps(response)

            id = request.args.get("id")
            if(id):
                user_id = int(id)
                user = Usuarios.query.filter_by(id = user_id).filter(Usuarios.nivel >= current_user.nivel).first()

                response = dict()
                if((user and not level) or (user and level == user.nivel.name)):
                    response["id"] = user.id
                    response["level"] = user.nivel.name
                    response["username"] = user.usuario
                    response["email"] = user.email
                    response["telephone"] = user.celular
                    response["current_user"] = True if current_user.id == user.id else False

                    # print(response)
                    return dumps(response)
                else:
                    # print(response)
                    return dumps({"error": "user_not_found"})
            else:
                users = Usuarios.query.filter(Usuarios.nivel >= current_user.nivel).order_by(Usuarios.usuario).all()

                response = {"users": list()}
                for user in users:
                    if(not level or level == user.nivel.name):
                        response["users"].append({
                            "id": user.id,
                            "level": user.nivel.name,
                            "username": user.usuario,
                            "email": user.email,
                            "telephone": user.celular
                        })
                
                # print(response)
                return dumps(response)

        elif(request.method == "POST" and current_user.nivel.value <= 1):
            form = get_users_form()
            if(form.validate_on_submit()):
                if(Nivel[form.level.data].value >= current_user.nivel.value):
                    hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
                    user = Usuarios(usuario=form.username.data, email=form.email.data, senha=hashed_password, celular=form.telephone.data, nivel=form.level.data)
                    database.session.add(user)
                    database.session.commit()
                    
                    response["status"] = "OK"
                    response["message"] = f"Usuário {form.username.data} criado com nível {form.level.data}"
                else:
                    response["status"] = "error"
                    response["message"] = "not_allowed"
            else:
                    # print("Não Validou o Formulário")
                    response["status"] = "error"
                    response["message"] = "form_validation"
                    response["errors"] = list()
                    for item in form:
                        if(item.id != "csrf_token" and item.id != "submit"):
                            response["errors"].append({"id": item.id, "message": item.errors[0] if item.errors else ""})
                            # print(f"{item.id}: {item.errors}")
            
            return dumps(response)
        
        elif(request.method == "PUT" and current_user.nivel.value <= 1):
            form = get_users_form()

            # Ignora as validações de usúario e e-mail já cadastrados
            sameUsername = False
            sameEmail = False
            if(not form.validate_on_submit()):
                if(form.username.errors and "já cadastrado" in form.username.errors[0]):
                    form.username.data = "toValidate_" + form.username.data
                    sameUsername = True
                
                if(form.email.errors and "já cadastrado" in form.email.errors[0]):
                    form.email.data = "toValidate_" + form.email.data
                    sameEmail = True
            
            if(form.validate()):
                # Remove a validação forçada de usuário e e-mail já cadastrados
                if(sameUsername):
                    form.username.data = form.username.data.split("toValidate ")[1]
                if(sameEmail):
                    form.email.data = form.email.data.split("toValidate_")[1]
                
                user = Usuarios.query.filter_by(id=int(form.users.data)).first()
                if(user):
                    if(Nivel[form.level.data].value >= current_user.nivel.value and
                       user.nivel.value >= current_user.nivel.value and
                       user.nivel):
                        old_name = user.usuario
                        user.usuario = form.username.data
                        user.email = form.email.data
                        user.celular = form.telephone.data
                        user.nivel = form.level.data

                        database.session.commit()

                        response["status"] = "OK"
                        response["message"] = f"Usuário {old_name} alterado com sucesso"
                    
                    else:
                        response["status"] = "error"
                        response["message"] = "not_allowed"
                else:
                    response["status"] = "error"
                    response["message"] = "user_dont_exist"
            else:
                # print("Não Validou o Formulário")
                response["status"] = "error"
                response["message"] = "form_validation"
                response["errors"] = list()
                for item in form:
                    if(item.id != "csrf_token" and item.id != "submit"):
                        response["errors"].append({"id": item.id, "message": item.errors[0] if item.errors else ""})
                        # print(f"{item.id}: {item.errors}")
            
            return dumps(response)
        
        elif(request.method == "DELETE" and current_user.nivel.value <= 1):
            user_id = int(request.form["users"])
            user = Usuarios.query.filter_by(id=user_id).filter(Usuarios.nivel >= current_user.nivel).first()
            if(user):
                database.session.delete(user)

                services = Servicos.query.filter(Servicos.tecnicos.any(user_id)).all()
                for service in services:
                    new_technicians_list = list()
                    for item in service.tecnicos:
                        if(item == user_id):
                            continue
                        new_technicians_list.append(item)
                    
                    service.tecnicos = new_technicians_list
                
                database.session.commit()                

                response["status"] = "OK"
                response["message"] = f'Usuário "{request.form["username"]}" deletado'
            else:
                response["status"] = "error"
                response["message"] = "user_not_found"
            
            return dumps(response)
        
        else:
            response["status"] = "error"
            response["message"] = "not_allowed"
            return dumps(response)
    
    else:
        abort(404)

@server.route("/api/services", methods=['GET', 'POST', 'PUT', 'DELETE'])
def services_api():
    if(current_user.is_authenticated):
        response = dict()
        if(request.method == 'GET' and current_user.nivel.value <= 3):
            user_is_technician = current_user.nivel.name == "TECNICO"
            # print(current_user.nivel.name)
            query_id = request.args.get("id")
            query_technician = request.args.get("technician")
            query_date = request.args.get("date")
            query_start_date = request.args.get("start_date")
            query_stop_date = request.args.get("stop_date")
            if(query_id):
                service_id = int(query_id)
                service = Servicos.query.filter_by(id = service_id).first()

                if(service and user_is_technician):
                    # print("User is technician")
                    service = service if current_user.id in service.tecnicos else None

                if(service):
                    if(service.grupo):
                        group_services = Servicos.query.filter_by(grupo = service.grupo).order_by(Servicos.id.desc()).all()
                        response["group_date_first"] = group_services[0].data.strftime("%Y-%m-%d")
                        response["group_date_last"] = group_services[-1].data.strftime("%Y-%m-%d")
                    else:
                        response["group_date_first"] = ""
                        response["group_date_last"] = ""
                    response["id"] = service.id
                    response["os"] = service.os
                    response["title"] = service.titulo
                    response["date"] = service.data.strftime("%Y-%m-%d")
                    response["address"] = service.endereco
                    response["equipment"] = service.equipamento
                    response["serial_number"] = service.serial
                    response["description"] = service.descricao
                    response["technicians"] = list()
                    for technician in service.tecnicos:
                        response["technicians"].append(str(technician))
                else:
                    response["message"] = "service_not_found"

            elif(query_technician or query_date or query_start_date or query_stop_date):
                response["services"] = list()

                # Necessário reavaliar essa regra de negócio
                # Verifica se o técnico é válido
                technician = None
                if(query_technician):
                    technician = Usuarios.query.filter_by(usuario=query_technician).first()
                
                # Verifica se a data é válida
                date = None
                if(query_date):
                    try:
                        date = datetime.strptime(query_date, "%Y-%m-%d")
                    except ValueError:
                        date = None
                
                start_date = None
                if(query_start_date):
                    try:
                        start_date = datetime.date(datetime.strptime(query_start_date, "%Y-%m-%d"))
                    except ValueError:
                        start_date = None
                
                stop_date = None
                if(query_stop_date):
                    try:
                        stop_date = datetime.strptime(query_stop_date, "%Y-%m-%d")
                    except ValueError:
                        stop_date = None

                services = Servicos.query

                if(current_user.nivel.name == "TECNICO"):
                    services = services.filter(Servicos.tecnicos.any(current_user.id))

                if(technician):
                    services = services.filter(Servicos.tecnicos.any(technician.id))
                
                if(date):
                    services = services.filter(Servicos.data == date)

                else:
                    if(start_date):
                        services = services.filter(Servicos.data >= start_date)
                    
                    if(stop_date):
                        services = services.filter(Servicos.data <= stop_date)
                
                services = services.order_by(Servicos.id).all()
                if(services):
                    for service in services:
                        response["services"].append({
                            "id": service.id,
                            "os": service.os,
                            "title": service.titulo,
                            "date": service.data.strftime("%Y-%m-%d"),
                            "address": service.endereco,
                            "equipment": service.equipamento,
                            "serial_number": service.serial,
                            "description": service.descricao,
                            "group": service.grupo,
                            "technicians": list()
                        })
                        
                        for technician in service.tecnicos:
                            response["services"][-1]["technicians"].append(technician)
                        
                        if(service.grupo):
                            group_services = Servicos.query.filter_by(grupo = service.grupo).order_by(Servicos.id.desc()).all()
                            response["services"][-1]["group_date_first"] = group_services[0].data.strftime("%Y-%m-%d")
                            response["services"][-1]["group_date_last"] = group_services[-1].data.strftime("%Y-%m-%d")
                        else:
                            response["services"][-1]["group_date_first"] = ""
                            response["services"][-1]["group_date_last"] = ""

            else:
                if(user_is_technician):
                    # print("User is technician")
                    services = Servicos.query.filter(Servicos.tecnicos.any(current_user.id)).all()
                else:
                    # print("User is not technician")
                    services = Servicos.query.order_by(Servicos.id.desc()).all()
                response["services"] = list()
                if(services):
                    for service in services:
                        response["services"].append({
                            "id": service.id,
                            "os": service.os,
                            "group": service.grupo,
                            "title": service.titulo,
                            "date": service.data.strftime("%Y-%m-%d"),
                            "address": service.endereco,
                            "equipment": service.equipamento,
                            "serial_number": service.serial,
                            "description": service.descricao,
                            "technicians": list()
                        })

                        if(service.grupo):
                            group_services = Servicos.query.filter_by(grupo = service.grupo).order_by(Servicos.id.desc()).all()
                            response["services"][-1]["group_date_first"] = group_services[0].data.strftime("%Y-%m-%d")
                            response["services"][-1]["group_date_last"] = group_services[-1].data.strftime("%Y-%m-%d")
                        else:
                            response["services"][-1]["group_date_first"] = ""
                            response["services"][-1]["group_date_last"] = ""
                        for technician in service.tecnicos:
                            response["services"][-1]["technicians"].append(str(technician))

                else:
                    response["message"] = "no_services"

            # print(response)            
            return dumps(response)

        elif(request.method == 'POST' and current_user.nivel.value <= 2):            
            form = get_services_form()
            if(form.technicians.data == [0]):
                form.technicians.data = []

            if(form.validate_on_submit()):
                service_repeat = True if form.service_repeat.data else False

                email_message = dict()
                email_message["title"] = form.title.data
                email_message["os"] = form.os.data if form.os.data else "(Sem OS)"
                email_message["equipment"] = form.equipment.data
                email_message["serial_number"] = form.serial_number.data
                email_message["address"] = form.address.data
                email_message["service"] = form.description.data
                email_message["dates"] = list()

                subject = ""

                telephone_list = list()
                email_list = list()
                email_message["technicians"] = list()
                for technician_id in form.technicians.data:
                    user = Usuarios.query.filter_by(id=technician_id).first()

                    if(not user or user.nivel.name != Nivel.TECNICO.name):
                        response["status"] = "error"
                        response["message"] = "only_tecnicians_allowed"
                        return dumps(response)

                    email_message["technicians"].append(user.usuario)
                    email_list.append(user.email)
                    if(user.celular):
                        telephone_list.append(user.celular)

                service_id = int(form.services.data)
                if(not service_id and not service_repeat):
                    dates_list = [form.date.data]
                    service_group_id = ""
                    response["message"] = f'Serviço "{form.title.data}" criado'
                    email_message["info"] = f"Serviço criado por {current_user.usuario},"
                    subject = "OS {} - Novo Serviço ({})"

                elif(not service_id and service_repeat):
                    dates_list = [form.group_date_first.data]
                    while(dates_list[-1] < form.group_date_last.data):
                        dates_list.append(dates_list[-1] + timedelta(days=1))
                    
                    service_group_id = b2a_hex(urandom(16)).decode()

                    response["message"] = f'Serviços "{form.title.data}" criados'
                    email_message["info"] = f"Serviço criado por {current_user.usuario},"
                    subject = "OS {} - Novo Serviço ({})"

                elif(service_id and service_repeat):
                    service = Servicos.query.filter_by(id=service_id).first()
                    for technician_id in service.tecnicos:
                        technician_email = Usuarios.query.filter_by(id=technician_id).first().email
                        if(not technician_email in email_list):
                            email_list.append(technician_email)
                        
                        technician_telephone = Usuarios.query.filter_by(id=technician_id).first().celular
                        if(technician_telephone and not technician_telephone in telephone_list):
                            telephone_list.append(technician_telephone)
                    
                    dates_list = [form.group_date_first.data]
                    while(dates_list[-1] < form.group_date_last.data):
                        dates_list.append(dates_list[-1] + timedelta(days=1))

                    if(service.grupo):
                        service_group_id = service.grupo
                        services = Servicos.query.filter_by(grupo=service.grupo).all()
                        for service in services:
                            database.session.delete(service)
                    else:
                        service_group_id = b2a_hex(urandom(16)).decode()
                        database.session.delete(service)

                    response["message"] = f'Serviços "{form.title.data}" atualizados'
                    email_message["info"] = f"Serviço atualizado por {current_user.usuario},"
                    subject = "OS {} - Atualização ({})"

                else:
                    response["status"] = "error"
                    response["message"] = "post_parameters_not_allowed"
                    return dumps(response)
                
                form.technicians.data.sort()
                for date in dates_list[::-1]:
                    service = Servicos(
                        os=form.os.data,
                        titulo=form.title.data,
                        data=date,
                        endereco=form.address.data,
                        equipamento=form.equipment.data,
                        serial = form.serial_number.data,
                        descricao=form.description.data,
                        tecnicos=form.technicians.data,
                        grupo=service_group_id
                    )
                    database.session.add(service)

                database.session.commit()

                if(service_repeat):
                    for date in dates_list:
                        email_message["dates"].append(date.strftime("%d-%m-%Y"))
                else:
                    date = form.date.data.strftime("%Y-%m-%d").split("-")
                    email_message["dates"] = ["-".join([date[2], date[1], date[0]])]

                if(email_list):
                    html_message = generate_email_message_for_service(
                        info = email_message["info"],
                        title = email_message["title"],
                        dates = email_message["dates"],
                        technicians = email_message["technicians"],
                        address = email_message["address"],
                        os = email_message["os"],
                        equipment = email_message["equipment"],
                        serial_number = email_message["serial_number"],
                        service = email_message["service"]
                    )

                    os = email_message["os"]
                    if(len(email_message["dates"]) > 1):
                        date_first = email_message["dates"][0]
                        date_last = email_message["dates"][-1]
                        subject_dates = f"{date_first} / {date_last}"
                    else:
                        date = email_message["dates"][0]
                        subject_dates = f"{date}"
                    send_html_email(email_list, subject=subject.format(os, subject_dates), message=html_message)
                
                if(telephone_list):
                    address = email_message["address"]
                    whatsapp_message = "*" + email_message["title"] + "*\n\n"
                    whatsapp_message += email_message["info"] + "\n\n"
                    whatsapp_message += "*OS*:\n" + email_message["os"] + "\n\n"
                    whatsapp_message += "*Equipamento*:\n" + email_message["equipment"] + "\n\n"
                    whatsapp_message += "*Nº de Série*:\n" + email_message["serial_number"] + "\n\n"
                    whatsapp_message += "*Data*:\n"
                    for date in email_message["dates"]:
                        whatsapp_message += date + "\n"
                    whatsapp_message += "\n*Técnicos*:\n"
                    for technician in email_message["technicians"]:
                        whatsapp_message += technician + "\n"
                    whatsapp_message += "\n*Endereço*:\n" + email_message["address"] + "\n\n"
                    whatsapp_message += "*Serviço*:\n" + email_message["service"] + "\n\n"
                    whatsapp_message += f"*MAPS*:\nhttps://www.google.com/maps/search/?api=1&query={quote(address)}\n\n"
                    whatsapp_message += f"*WAZE*:\nhttps://waze.com/ul?q={quote(address)}&navigate=yes"

                    message_id = queue_whatsapp_messages_tasks(telephone_list, whatsapp_message)
                
                response["status"] = "OK"

            else:
                # print("Não Validou o Formulário")
                response["status"] = "error"
                response["message"] = "form_validation"
                response["errors"] = list()
                for item in form:
                    if(item.id != "csrf_token" and item.id != "submit"):
                        response["errors"].append({"id": item.id, "message": item.errors[0] if item.errors else ""})
                        # print(f"{item.id}: {item.errors}")

            return dumps(response)

        elif(request.method == 'PUT' and current_user.nivel.value <= 2):
            form = get_services_form()
            if(True): # Alternativa if(form.technicians.data)
                if(form.validate_on_submit()):
                    if(form.technicians.data == [0]):
                        form.technicians.data = []

                    for technician_id in form.technicians.data:
                        user = Usuarios.query.filter_by(id=technician_id).first()
                        if(not user or user.nivel.name != Nivel.TECNICO.name):
                            response["status"] = "error"
                            response["message"] = "only_tecnicians_allowed"
                            return dumps(response)

                    form.technicians.data.sort()
                    service = Servicos.query.filter_by(id=int(form.services.data)).first()
                    if(service):
                        email_message = dict()
                        email_message["title"] = form.title.data
                        email_message["os"] = form.os.data if form.os.data else "(Sem OS)"
                        email_message["equipment"] = form.equipment.data
                        email_message["serial_number"] = form.serial_number.data
                        email_message["address"] = form.address.data
                        email_message["service"] = form.description.data
                        email_message["dates"] = list()

                        subject = ""

                        telephone_list = list()
                        email_list = list()
                        email_message["technicians"] = list()
                        for technician_id in form.technicians.data:
                            user = Usuarios.query.filter_by(id=technician_id).first()
                            email_message["technicians"].append(user.usuario)
                            email_list.append(user.email)
                            if(user.celular):
                                telephone_list.append(user.celular)
                        
                        service_id = int(form.services.data)
                        service = Servicos.query.filter_by(id=service_id).first()
                        for technician_id in service.tecnicos:
                            technician_email = Usuarios.query.filter_by(id=technician_id).first().email
                            if(not technician_email in email_list):
                                email_list.append(technician_email)
                        
                            technician_telephone = Usuarios.query.filter_by(id=technician_id).first().celular
                            if(technician_telephone and not technician_telephone in telephone_list):
                                telephone_list.append(technician_telephone)

                        old_title = service.titulo
                        service.os = form.os.data
                        service.titulo = form.title.data
                        service.data = form.date.data
                        service.endereco = form.address.data
                        service.equipamento = form.equipment.data
                        service.serial = form.serial_number.data
                        service.descricao = form.description.data
                        service.tecnicos = form.technicians.data
                        database.session.commit()
                        response["status"] = "OK"
                        response["message"] = f'Serviço "{old_title}" atualizado'

                        email_message["dates"] = [form.date.data.strftime("%d-%m-%Y")]
                        email_message["info"] = f"Serviço atualizado por {current_user.usuario},"
                        subject = "OS {} - Atualização ({})"

                        if(email_list):
                            html_message = generate_email_message_for_service(
                                info = email_message["info"],
                                title = email_message["title"],
                                dates = email_message["dates"],
                                technicians = email_message["technicians"],
                                address = email_message["address"],
                                os = email_message["os"],
                                equipment = email_message["equipment"],
                                serial_number = email_message["serial_number"],
                                service = email_message["service"]
                            )

                            os = email_message["os"]
                            if(len(email_message["dates"]) > 1):
                                date_first = email_message["dates"][0]
                                date_last = email_message["dates"][-1]
                                subject_dates = f"{date_first} / {date_last}"
                            else:
                                date = email_message["dates"][0]
                                subject_dates = f"{date}"
                            send_html_email(email_list, subject=subject.format(os, subject_dates), message=html_message)
                        
                        if(telephone_list):
                            address = email_message["address"]
                            whatsapp_message = "*" + email_message["title"] + "*\n\n"
                            whatsapp_message += email_message["info"] + "\n\n"
                            whatsapp_message += "*OS*:\n" + email_message["os"] + "\n\n"
                            whatsapp_message += "*Equipamento*:\n" + email_message["equipment"] + "\n\n"
                            whatsapp_message += "*Nº de Série*:\n" + email_message["serial_number"] + "\n\n"
                            whatsapp_message += "*Data*:\n"
                            for date in email_message["dates"]:
                                whatsapp_message += date + "\n"
                            whatsapp_message += "\n*Técnicos*:\n"
                            for technician in email_message["technicians"]:
                                whatsapp_message += technician + "\n"
                            whatsapp_message += "\n*Endereço*:\n" + email_message["address"] + "\n\n"
                            whatsapp_message += "*Serviço*:\n" + email_message["service"] + "\n\n"
                            whatsapp_message += f"*MAPS*:\nhttps://www.google.com/maps/search/?api=1&query={quote(address)}\n\n"
                            whatsapp_message += f"*WAZE*:\nhttps://waze.com/ul?q={quote(address)}&navigate=yes"

                            message_id = queue_whatsapp_messages_tasks(telephone_list, whatsapp_message)

                    else:
                        response["status"] = "error"
                        response["message"] = "service_not_found"
                else:
                    # print("Não Validou o Formulário")
                    response["status"] = "error"
                    response["message"] = "form_validation"
                    response["errors"] = list()
                    for item in form:
                        if(item.id != "csrf_token" and item.id != "submit"):
                            response["errors"].append({"id": item.id, "message": item.errors[0] if item.errors else ""})
                            # print(f"{item.id}: {item.errors}")
            else:
                response["status"] = "error"
                response["message"] = "no_technician"

            return dumps(response)

        elif(request.method == 'DELETE' and current_user.nivel.value <= 2):
            form = get_services_form()
            form.validate_on_submit()

            service_id = int(form.services.data)
            service_repeat = True if form.service_repeat.data == True else False
            service = Servicos.query.filter_by(id=service_id).first()
            if(service):
                response["status"] = "OK"

                email_message = dict()
                email_message["action"] = "cancelado"
                email_message["user"] = current_user.usuario
                email_message["title"] = form.title.data
                email_message["address"] = form.address.data
                email_message["os"] = form.os.data if form.os.data else "(Sem OS)"
                email_message["equipment"] = form.equipment.data
                email_message["serial_number"] = form.serial_number.data
                email_message["service"] = form.description.data
                email_list = list()
                telephone_list = list()

                if(service_repeat):
                    if(service.grupo):
                        email_message["info"] = f"{current_user.usuario} cancelou todos os dias desse serviço,"
                    else:
                        email_message["info"] = f"{current_user.usuario} cancelou esse serviço,"
                else:
                    if(service.grupo):
                        date = form.date.data.strftime("%Y-%m-%d").split("-")
                        date = "-".join([date[2], date[1], date[0]])
                        email_message["info"] = f"{current_user.usuario} cancelou esse serviço apenas no dia {date},"
                    else:
                        email_message["info"] = f"{current_user.usuario} cancelou esse serviço,"

                email_message["technicians"] = list()
                for technician_id in form.technicians.data:
                    user = Usuarios.query.filter_by(id=technician_id).first()

                    if(not user or user.nivel.name != Nivel.TECNICO.name):
                        response["status"] = "error"
                        response["message"] = "technician_not_found"
                        return dumps(response)

                    email_message["technicians"].append(user.usuario)
                    email_list.append(user.email)
                    if(user.celular):
                        telephone_list.append(user.celular)

                if(service.grupo):
                    services = Servicos.query.filter_by(grupo=service.grupo).order_by(Servicos.data).all()
                    email_message["dates"] = [service.data.strftime("%d-%m-%Y") for service in services]

                    if(not service_repeat and len(services) > 1):
                        date = form.date.data.strftime("%d-%m-%Y")
                        email_message["dates"].remove(date)
                else:
                    email_message["dates"] = [service.data.strftime("%d-%m-%Y")]

                if(service_repeat and service.grupo):
                    for service in services:
                        database.session.delete(service)
                    response["message"] = f'Serviços "{form.title.data}" deletados'
                else:
                    database.session.delete(service)
                    response["message"] = f'Serviço "{form.title.data}" deletado'

                database.session.commit()

                if(email_list):
                    html_message = generate_email_message_for_service(
                        info = email_message["info"],
                        title = email_message["title"],
                        dates = email_message["dates"],
                        technicians = email_message["technicians"],
                        address = email_message["address"],
                        os = email_message["os"],
                        equipment = email_message["equipment"],
                        serial_number = email_message["serial_number"],
                        service = email_message["service"]
                    )

                    os = email_message["os"]
                    if(len(email_message["dates"]) > 1):
                        date_first = email_message["dates"][0]
                        date_last = email_message["dates"][-1]
                        subject_dates = f"{date_first} / {date_last}"
                    else:
                        date = email_message["dates"][0]
                        subject_dates = f"{date}"
                    send_html_email(email_list, subject=f"OS {os} - Serviço Cancelado ({subject_dates})", message=html_message)
                
                if(telephone_list):
                    address = email_message["address"]
                    whatsapp_message = "*" + email_message["title"] + "*\n\n"
                    whatsapp_message += email_message["info"] + "\n\n"
                    whatsapp_message += "*OS*:\n" + email_message["os"] + "\n\n"
                    whatsapp_message += "*Equipamento*:\n" + email_message["equipment"] + "\n\n"
                    whatsapp_message += "*Nº de Série*:\n" + email_message["serial_number"] + "\n\n"
                    whatsapp_message += "*Data*:\n"
                    for date in email_message["dates"]:
                        whatsapp_message += date + "\n"
                    whatsapp_message += "\n*Técnicos*:\n"
                    for technician in email_message["technicians"]:
                        whatsapp_message += technician + "\n"
                    whatsapp_message += "\n*Endereço*:\n" + email_message["address"] + "\n\n"
                    whatsapp_message += "*Serviço*:\n" + email_message["service"] + "\n\n"
                    whatsapp_message += f"*MAPS*:\nhttps://www.google.com/maps/search/?api=1&query={quote(address)}\n\n"
                    whatsapp_message += f"*WAZE*:\nhttps://waze.com/ul?q={quote(address)}&navigate=yes"

                    message_id = queue_whatsapp_messages_tasks(telephone_list, whatsapp_message)

            else:
                response["status"] = "error"
                response["message"] = "service_not_found"
            
            return dumps(response)

        else:
            response["status"] = "error"
            response["message"] = "method_not_allowed"
            return dumps(response)
    
    else:
        abort(404)

@server.route("/api/effort_description")
def effort_description():
    if(current_user.is_authenticated and current_user.nivel.value <= 2):
        os_id = request.args.get("os")
        if(os_id):
            response = get_effort_description(os_id)
            # print(response)
            return dumps(response)
        else:
            return dumps({})

    else:
        abort(404)

@server.route("/api/whatsapp/client/qrcode", methods=['GET', 'POST'])
def get_whatsapp_qrcode():
    if(current_user.is_authenticated):
        if(request.method == 'GET'):
            qrcode_id = queue_whatsapp_qrcodes_tasks()
            return dumps({"status": "ok", "qrcode_id": qrcode_id})
        elif(request.method == 'POST'):
            qrcode_id = request.form.get("qrcode_id")
            if(not qrcode_id):
                return dumps({"status": "no_qrcode_id"})

            response = get_whatsapp_task_response(qrcode_id)
            if(response["status"] == "task_not_found"):
                return dumps({"status": "task_not_found"})

            return dumps(response)
        else:
            return dumps({"status": "method_not_allowed"})
    else:
        abort(404)

@server.route("/api/whatsapp/client/disconnect")
def disconnect_whatsapp():
    if(current_user.is_authenticated):
        queue_whatsapp_disconnect()
        return dumps({"status": "ok"})
    else:
        abort(404)

# @server.route("/api/whatsapp/client/messages", methods=['GET', 'POST'])
# def whatsapp_messages():
#     if(current_user.is_authenticated):
#         if(request.method == 'GET'):
#             telephones = request.args.getlist("to")
#             message = request.args.get("message")
#             message_id = queue_whatsapp_messages_tasks(telephones, message)

#             return message_id
#         elif(request.method == 'POST'):
#             message_id = request.form["message_id"]

#             return get_whatsapp_task_response(message_id)
#         else:
#             return dumps({"status": "method_not_allowed"})
#     else:
#         abort(404)

@server.route("/api/whatsapp/server/services", methods=['GET', 'POST'])
def whatsapp_messages():
    api_key = request.headers.get("Whatsapp-API-Key")
    if(api_key == WHATSAPP_API_KEY):
        if(request.method == 'GET'):
            messages_data = get_whatsapp_messages_tasks()
            qrcodes_data = get_whatsapp_qrcodes_tasks()
            to_disconnect = "True" if get_whatsapp_disconnect() else "False"

            if(messages_data or qrcodes_data or to_disconnect == "True"):
                return dumps({"status": "ok", "data": {"messages": messages_data, "qrcodes": qrcodes_data, "disconnect": to_disconnect}})
            else:
                return dumps({"status": "no_service"})
        elif(request.method == 'POST'):
            tasks = request.json
            queue_whatsapp_task_response(tasks)

            return dumps({"status": "ok"})
    else:
        abort(404)