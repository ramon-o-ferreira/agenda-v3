from agenda import mail, queue, Nivel
from agenda.models import Usuarios, Servicos
from agenda.forms import UsersForm, ServicesForm, RegistrationForm

from flask import render_template
from flask_login import current_user
from flask_mail import Message

from datetime import datetime
from dateutil.relativedelta import relativedelta as timedelta

from time import time
from json import loads, dumps
from os import urandom, environ
from binascii import b2a_hex
from requests import Session

from html import unescape
from unicodedata import normalize
from urllib.parse import quote

WEEK_DAYS = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"]
DATE_FORMAT = "%Y-%m-%d"
TABLE_HEADER_DATE_FORMAT = "%d-%m-%Y"

EFFORT_USER = environ.get("EFFORT_USER")
EFFORT_PASSWORD = environ.get("EFFORT_PASSWORD")
EFFORT_LOGIN_URL = environ.get("EFFORT_LOGIN_URL")
EFFORT_SEARCH_OS_URL = environ.get("EFFORT_SEARCH_OS_URL")
EFFORT_OBS_URL = environ.get("EFFORT_OBS_URL")

MESSAGING_APP_URL = environ.get("MESSAGING_APP_URL")
SEND_EMAIL_API_ROUTE = environ.get("SEND_EMAIL_API_ROUTE")
SEND_WHATSAPP_API_ROUTE = environ.get("SEND_WHATSAPP_API_ROUTE")
GET_WHATSAPP_QRCODE_API_ROUTE = environ.get("GET_WHATSAPP_QRCODE_API_ROUTE")

# Função de inicialização do formulário de Serviços
def get_services_form():
    services_form = ServicesForm()

    services_list = Servicos.query.order_by(Servicos.id.desc()).all()
    services_form.services.choices = [(0, "Novo Serviço")]
    for service in services_list:
        services_form.services.choices.append((service.id, service.titulo))

    technicians = Usuarios.query.filter_by(nivel="TECNICO").order_by(Usuarios.usuario).all()
    services_form.technicians.choices = list()
    for technician in technicians:
        services_form.technicians.choices.append((technician.id, technician.usuario))

    return services_form

# Função de inicialização do formulário de Usuários
def get_users_form():
    users_form = UsersForm()

    users_list = Usuarios.query.filter(Usuarios.nivel >= current_user.nivel).order_by(Usuarios.usuario).all()
    users_form.users.choices = [(0, "Novo Usuário")]
    for user in users_list:
        users_form.users.choices.append((user.id, user.usuario))

    choices = [(member.name, member.name) for member in Nivel]
    users_form.level.choices = choices[Nivel[current_user.nivel.name].value:]

    return users_form

def get_registration_form():
    registration_form = RegistrationForm()

    choices = [(member.name, member.name) for member in Nivel]
    if(current_user.is_authenticated):
        registration_form.level.choices = choices[Nivel[current_user.nivel.name].value:]
    else:
        registration_form.level.choices = choices
    
    registration_form.technicians.choices = [(0, "Novo Técnico")]
    registration_form.technicians.data = "0"

    return registration_form

def get_week(date=datetime.now()):
    first_date = datetime(day=date.day, month=date.month, year=date.year) - timedelta(days=date.weekday())

    week = list()
    for i in range(7):
        delta = timedelta(days=i)
        week.append(first_date + delta)

    return week

def get_schedule_table(now=datetime.now()):
    if(type(now) == type(str())):
        now = datetime.fromisocalendar(now)

    schedule_table = dict()
    schedule_table["buttons"] = dict()
    schedule_table["buttons"]["previous_month"] = get_week(now - timedelta(months=1))[0].strftime(DATE_FORMAT)
    schedule_table["buttons"]["previous_week"] = get_week(now - timedelta(weeks=1))[0].strftime(DATE_FORMAT)
    schedule_table["buttons"]["today"] = datetime.now().strftime(DATE_FORMAT)
    schedule_table["buttons"]["next_week"] = get_week(now + timedelta(weeks=1))[0].strftime(DATE_FORMAT)
    schedule_table["buttons"]["next_month"] = get_week(now + timedelta(months=1))[0].strftime(DATE_FORMAT)

    schedule_table["dates"] = list()
    schedule_table["header"] = list()
    schedule_table["header"].append("Colaboradores")
    week_days_list = get_week(now)
    for day in week_days_list:
        schedule_table["dates"].append(day.strftime(DATE_FORMAT))
        schedule_table["header"].append(f"{WEEK_DAYS[day.weekday()]}_{day.strftime(TABLE_HEADER_DATE_FORMAT)}")

    if(current_user.nivel.name == "TECNICO"):
        week_services = Servicos.query.filter(Servicos.data >= week_days_list[0]).filter(Servicos.data <= week_days_list[-1]).filter(Servicos.tecnicos.any(current_user.id)).order_by(Servicos.id).all()
    else:
        week_services = Servicos.query.filter(Servicos.data >= week_days_list[0]).filter(Servicos.data <= week_days_list[-1]).order_by(Servicos.id).all()

    schedule_table["services"] = list()
    for service in week_services:
        # print(service)
        schedule_table["services"].append(dict())
        schedule_table["services"][-1]["id"] = service.id
        schedule_table["services"][-1]["title"] = service.titulo
        schedule_table["services"][-1]["date"] = service.data
        schedule_table["services"][-1]["address"] = service.endereco
        schedule_table["services"][-1]["description"] = service.descricao
        schedule_table["services"][-1]["group"] = service.grupo
        schedule_table["services"][-1]["technicians"] = service.tecnicos

    schedule_table["body"] = list()
    schedule_table["technicians"] = list()
    technicians = Usuarios.query.filter_by(nivel = Nivel.TECNICO.name).order_by(Usuarios.usuario).all()
    if(technicians):
        for technician in technicians:
            schedule_table["technicians"].append({"id": technician.id, "name": technician.usuario})
            row = list()
            if(current_user.nivel.name == "TECNICO"):
                if(len(schedule_table["technicians"]) == 1):
                    row.append(current_user.usuario)
                    for day in week_days_list:
                        row.append("")
                    
                    schedule_table["body"].append(row)
            else:
                row.append(technician.usuario)
                for day in week_days_list:
                    row.append("")
            
                schedule_table["body"].append(row)
    else:
        schedule_table["body"].append(["Nenhum técnico cadastrado"])

    return schedule_table

def send_html_email(to, subject="", message=""):
    mail_message = Message(
        subject = subject,
        recipients = to if type(to) == type(list()) else [to],
        html = message
    ) # Converte o endereço do destino para lista, caso não seja

    counter = 0
    while(counter < 3):
        try:
            mail.send(mail_message)
            return True
        except Exception as err:
            counter += 1

    print("Erro ao enviar o e-mail")
    return False

def send_email(to, subject="", message=""):
    mail_message = Message(
        subject = subject,
        recipients = to if type(to) == type(list()) else [to],
        body = message
    ) # Converte o endereço do destino para lista, caso não seja

    counter = 0
    while(counter < 3):
        try:
            mail.send(mail_message)
            return True
        except Exception as err:
            counter += 1

    print("Erro ao enviar o e-mail")
    return False

def generate_email_message_for_service(info, title, dates, technicians, address, os, equipment, serial_number, service):
    message = dict()
    message["title"] = title
    message["info"] = info
    message["service"] = list()
    message["service"].append(["OS", os])
    message["service"].append(["Equipamento", equipment])
    message["service"].append(["Nº de Série", serial_number])
    message["service"].append(["Datas" if len(dates) > 1 else "Data", dates])
    message["service"].append(["Técnicos", " - ".join(technicians)])
    message["service"].append(["Endereço", address])
    message["service"].append(["Serviço", service])
    message["address_maps_link"] = f"https://www.google.com/maps/search/?api=1&query={quote(address)}"
    message["address_waze_link"] = f"https://waze.com/ul?q={quote(address)}&navigate=yes"

    return render_template('email_service_message.html', message=message)

def get_input(name, text):
    if(name and text):
        text_start_pos = text.find(f'name="{name}"')
        if(text_start_pos == -1):
            return False

        text_start_pos = text.find('value="', text_start_pos) + 7
        if(text_start_pos == -1):
            return False
        
        text_stop_pos = text.find('"', text_start_pos)
        if(text_stop_pos == -1):
            return False
        
        text = text[text_start_pos:text_stop_pos].replace("\n", "").replace("\r", "").replace("<br>", "\n")
        return normalize('NFKC', unescape(text))
    else:
        return False

def get_textarea(name, text):
    if(name and text):
        text_start_pos = text.find(f'name="{name}"')
        if(text_start_pos == -1):
            return False

        text_start_pos = text.find('>', text_start_pos) + 1
        if(text_start_pos == -1):
            return False
        
        text_stop_pos = text.find('</textarea>', text_start_pos)
        if(text_stop_pos == -1):
            return False
        
        text = text[text_start_pos:text_stop_pos].replace("\n", "").replace("\r", "").replace("<div><br></div>", "\n").replace("<div>", "\n").replace("</div>", "").replace("<br>", "\n")
        return normalize('NFKC', unescape(text))
    else:
        return False

def get_effort_description(os_id):
    s = Session()
    # print(s.cookies)
    # print(EFFORT_USER)
    response = s.post(EFFORT_LOGIN_URL, json={"login":f"{EFFORT_USER}","senha":f"{EFFORT_PASSWORD}","empresaId":"1","altura":864,"largura":1536,"isMobile":False,"mobileConnectPlus":False})
    if(response.status_code != 200):
        return False

    response = s.get(EFFORT_SEARCH_OS_URL.format(os_id))

    if(response.status_code != 200):
        return False
    
    service = dict()

    equipment = get_input("txtequipamentodescricao", response.text)
    if(equipment):
        equipment = equipment.split(" - ")[1]
        while(equipment[-1] == " "):
            equipment = equipment[:-1]
        
        service["equipment"] = equipment

    equipment_serial_number = get_input("txtnserie", response.text)
    if(equipment_serial_number):
        while(equipment_serial_number[-1] == " "):
            equipment_serial_number = equipment_serial_number[:-1]
        
        service["equipment_serial_number"] = equipment_serial_number

    os_serial = get_input("hidCodOSSerial", response.text)
    response = s.get(EFFORT_OBS_URL.format(os_serial))

    if(response.status_code != 200):
        return False

    service_description = get_textarea("FreeTextBox1", response.text)
    if(service_description):
        while(service_description[0] == '\n'):
            service_description = service_description[1:]
    
        service["technical_description"] = service_description

    return service

def queue_whatsapp_messages_tasks(to, message):
    message_id = f"whatsapp_message_{b2a_hex(urandom(16)).decode()}"
    telephones = to if type(to) == type(list()) else [to]
    whatsapp_data = {"message_id": message_id, "to": telephones, "message": message}
    queue.rpush("whatsapp_messages", dumps(whatsapp_data))

    return message_id

def get_whatsapp_messages_tasks():
    if(queue.exists("whatsapp_messages")):
        messages = list()
        while(queue.exists("whatsapp_messages")):
            messages.append(loads(queue.lpop("whatsapp_messages").decode()))

        return messages
    else:
        []

def queue_whatsapp_qrcodes_tasks():
    qrcode_id = f"whatsapp_qrcode_{b2a_hex(urandom(16)).decode()}"
    queue.rpush("whatsapp_qrcodes", qrcode_id)

    return qrcode_id

def get_whatsapp_qrcodes_tasks():
    if(queue.exists("whatsapp_qrcodes")):
        qrcodes = list()
        while(queue.exists("whatsapp_qrcodes")):
            qrcodes.append(queue.lpop("whatsapp_qrcodes").decode())
        
        return qrcodes
    else:
        []

def queue_whatsapp_task_response(tasks):
    for qrcode in tasks["qrcodes"]:
        qrcode_id = qrcode["task_id"]
        status = qrcode["status"]
        data = qrcode["data"]
        expiration = qrcode["expiration"]

        queue.rpush(qrcode_id, dumps({"status": status, "data": data}))
        if(expiration == ""):
            queue.expire(qrcode_id, 60)
        elif(int(expiration) - int(time()) > 0):
            queue.expire(qrcode_id, int(expiration) - int(time()))

    for message in tasks["messages"]:
        message_id = message["task_id"]
        status = message["status"]

        queue.rpush(message_id, dumps({"status": status}))
        queue.expire(message_id, 600)

def get_whatsapp_task_response(task_id):
    if(queue.exists(task_id)):
        task_response = loads(queue.lpop(task_id).decode())
        return task_response
    else:
        return {"status": "task_not_found"}

def queue_whatsapp_disconnect():
    queue.set("whatsapp_disconnect_request", 1)

def get_whatsapp_disconnect():
    if(queue.get("whatsapp_disconnect_request")):
        queue.delete("whatsapp_disconnect_request")
        return True
    else:
        return False