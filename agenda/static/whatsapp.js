async function set_display(context="", qrcode="") {
    const whatsapp_image = document.getElementById("whatsapp_image");
    const loading_screen = document.getElementById("loading_screen");
    const whatsapp_disconnect_button = document.getElementById("whatsapp_disconnect_button");

    switch(context) {
        case "LOADING":
            whatsapp_disconnect_button.hidden = true;
            whatsapp_image.hidden = true;
            loading_screen.hidden = false;
            break;
        case "CONNECTED":
            whatsapp_disconnect_button.hidden = false;
            loading_screen.hidden = true;
            whatsapp_image.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/768px-WhatsApp.svg.png?20220228223904";
            whatsapp_image.hidden = false;
            break;
        case "QRCODE":
            whatsapp_disconnect_button.hidden = true;
            loading_screen.hidden = true;
            whatsapp_image.src = `data:image/png;base64, ${qrcode}`;
            whatsapp_image.hidden = false;
            break;
        default:
            console.log("No context to set")
            break;
    }
}

async function get_qrcode() {
    qrcode_id = "";
    await fetch(`/api/whatsapp/client/qrcode`)
    .then(response => response.json())
    .then(response => {
        if(response.status == "ok") {
            qrcode_id = response.qrcode_id;
        } else {
            qrcode_id = "";
            throw new Error("Erro desconhecido");
        }
    })
    .catch(error => {
        qrcode_id = "";
        const message = "Houve um problema ao requisitar o Código QR";
        console.error(message, error);
    });

    let last_time = 0;
    let now = Date.now();
    let keep_going = true;
    while(keep_going && Date.now() - now < 30000){
        if(last_time + 1000 < Date.now()) {
            const params = new URLSearchParams();
            params.append("qrcode_id", qrcode_id);
            await fetch(`/api/whatsapp/client/qrcode`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            })
            .then(response => {
                if(!response.ok) {
                    let message = "Resposta do Servidor não OK";
                    throw new Error(message);
                }
                return response.json();
            })
            .then(response => {
                if(response.status === 'ok') {
                    set_display("QRCODE", response.data);
                    keep_going = false;
                } else if(response.status === "whatsapp_already_connected") {
                    set_display("CONNECTED");
                    keep_going = false;
                } else if(response.status === 'task_not_found') {
                    //console.log("Task not found");
                } else {
                    console.log(`Status Desconhecido (${response.status})`);
                }
            })
            .catch(error => {
                let message = "Houve um problema ao pedir o Código QR";
                console.error(message, error);
            });

            last_time = Date.now();
        }
    }
}

async function disconnect_whatsapp() {
    set_display("LOADING")
    await fetch(`/api/whatsapp/client/disconnect`)
    .then(response => response.json())
    .then(response => {
        if(response.status == "ok") {
            setTimeout(() => { window.location.reload(true); }, 5000)
        } else {
            throw new Error("Erro desconhecido");
        }
    })
    .catch(error => {
        qrcode_id = "";
        const message = "Houve um problema ao desconectar o Whatsapp";
        console.error(message, error);
    });
}

get_qrcode()