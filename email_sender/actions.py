from email_sender.email import generate_html_message_for_service

from os import environ

from smtplib import SMTP_SSL
from email.message import EmailMessage

def send_service_email(data):
    MAIL_USERNAME = environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = environ.get("MAIL_PASSWORD")
    MAIL_SERVER = environ.get("MAIL_SERVER")
    MAIL_PORT = int(environ.get("MAIL_PORT"))

    message = EmailMessage()
    message["Subject"] = data["email"]["subject"]
    message["From"] = MAIL_USERNAME
    message["To"] = ", ".join(data["email"]["to"]) if type(data["email"]["to"]) == type(list()) else data["email"]["to"]

    html_message = generate_html_message_for_service(
        info = data["email"]["body"]["info"],
        title = data["email"]["body"]["title"],
        dates = data["email"]["body"]["dates"],
        technicians = data["email"]["body"]["technicians"],
        address = data["email"]["body"]["address"],
        os = data["email"]["body"]["os"],
        equipment = data["email"]["body"]["equipment"],
        serial_number = data["email"]["body"]["serial_number"],
        service = data["email"]["body"]["service"]
    )

    if(data["body_type"] == "text"):
        message.set_content(data["email"]["body"])
    elif(data["body_type"] == "html"):
        message.add_alternative(html_message, subtype='html')
    
    counter = 0
    while(counter < 3):
        try:
            with SMTP_SSL(MAIL_SERVER, MAIL_PORT) as mail:
                mail.login(MAIL_USERNAME, MAIL_PASSWORD)
                mail.send_message(message)

            # print("E-mail enviado!")
            return True
        except Exception as err:
            counter += 1
    
    return False