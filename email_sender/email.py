from jinja2 import Environment, FileSystemLoader

from urllib.parse import quote

def generate_html_message_for_service(info, title, dates, technicians, address, os, equipment, serial_number, service):
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

    env = Environment(loader=FileSystemLoader("./email_sender/templates"))
    template = env.get_template("email_service_message.html")

    return template.render(message=message)