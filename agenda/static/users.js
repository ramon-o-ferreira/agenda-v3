async function send_form(action) {
    const user_id = document.getElementById("users").value;

    const params = new URLSearchParams();
    params.append("csrf_token", document.getElementById("csrf_token").value);
    params.append("users", user_id);
    params.append("level", document.getElementById("level").value);
    params.append("username", document.getElementById("username").value.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ')); // Regex remove espaços no inície e fim do nome, e mantém apenas 1 espaço entre os nomes
    params.append("email", document.getElementById("email").value);
    params.append("telephone", document.getElementById("telephone").value.replace(/\D/g, '').slice(0, 11)); // Regex remove carácteres que não são números
    params.append("password", document.getElementById("password").value);
    params.append("confirm_password", document.getElementById("confirm_password").value);

    console.log(document.getElementById("username").value.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' '))

    let method;
    if(action == "SAVE") {
        if(user_id == "0") {
            method = "POST";
        }
        else {
            method = "PUT";
        }
    } else if(action == "DELETE") {
        method = "DELETE"
    } else {
        console.error("Invalid method");
        return;
    }

    // console.log(method);
    // console.log(params.toString());

    await fetch(`/api/users`, {
        method: method,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    })
    .then(response => {
        if(!response.ok) {
            let message = "Resposta do Servidor não OK";
            flash_message(message, 'danger')
            throw new Error(message);
        }
        return response.json();
    })
    .then(response => {
        // console.log(response);
        if(response.status == 'OK') {
            reset_users_form();
            flash_message(response.message, 'success');
        } else if(response.status == 'error') {
            flash_message();
            if(response.message == 'form_validation') {
                for(const item of response.errors) {
                    // console.log(`${item.id}: ${item.message}`);
                }
                update_form_errors_message(response.errors);
            } else {
                // console.log(response.message);
                reset_services_form();
                flash_message("Os dados não foram salvos", 'warning');
            }
        } else {
            reset_services_form();
            flash_message("Erro desconhecido", 'warning');
        }
    })
    .catch(error => {
        let message = "Houve um problema ao salvar o Usuário";
        flash_message(message, 'danger');
        console.error(message, error);
    });
}

function update_user_data() {
    flash_message();
    update_form_errors_message();

    const users = document.getElementById("users").value;
    const level = document.getElementById("level");
    const level_group = document.getElementById("level_group");
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const telephone = document.getElementById("telephone");
    const password = document.getElementById("password");
    const confirm_password = document.getElementById("confirm_password");
    const password_group = document.getElementById("password_group");
    const confirm_password_group = document.getElementById("confirm_password_group");
    const delete_button = document.getElementById("delete_button");

    if(users != 0) {
        fetch(`/api/users?id=${users}`)
        .then(response => response.json())
        .then(user => {
            if(user) {
                username.value = user.username;
                email.value = user.email;
                telephone.value = user.telephone;
                level_group.hidden = user.current_user;
                password_group.hidden = true;
                confirm_password_group.hidden = true;
                level.value = user.level;
                password.value = "123456"
                confirm_password.value = "123456"
                if(current_user.id === user.id) { delete_button.hidden = true }
                else { delete_button.hidden = false; }
            }
        });
    }
    else {
        reset_users_form();
    }
}

function update_form_errors_message(errors=[{"id": "username", "message": ""}, {"id": "users", "message": ""}, {"id": "level", "message": ""}, {"id": "email", "message": ""}, {"id": "telephone", "message": ""}, {"id": "password", "message": ""}, {"id": "confirm_password", "message": ""}]) {
    let first_item_focus = true;
    for(const item of errors) {
        const field = document.getElementById(item.id);
        const field_error_message = document.getElementById(`${item.id}_error_message`);
        if(item.message) {
            if(first_item_focus) {
                field.focus();
                first_item_focus = false;
            }
            field.classList.add("is-invalid");
            field_error_message.querySelector("span").innerText = item.message;
        } else {
            field.classList.remove("is-invalid");
            field_error_message.querySelector("span").innerText = "";
        }
    }
}

function flash_message(message="", category="primary") {
    // Categorias: primary (padrão), secondary, success, danger, warning, info, light, dark
    const flash = document.getElementById("users_flash_message");
    flash.innerText = "";
    flash.classList = "alert";
    if(message) {
        flash.innerText = message;
        if(category) {
            flash.classList.add(`alert-${category}`);
        }
        flash.hidden = false;
        flash.scrollIntoView({ block: 'end' });
    } else {
        flash.hidden = true;
    }
}

function reset_users_form() {
    const users = document.getElementById("users");
    const level = document.getElementById("level");
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const telephone = document.getElementById("telephone");
    const password = document.getElementById("password");
    const confirm_password = document.getElementById("confirm_password");
    const password_group = document.getElementById("password_group");
    const confirm_password_group = document.getElementById("confirm_password_group"); 
    const delete_button = document.getElementById("delete_button");

    users.value = users.options[0].value;
    level.value = level.options[0].value;
    username.value = "";
    email.value = "";
    telephone.value = "";
    password.value = "";
    confirm_password.value = ""
    password_group.hidden = false;
    confirm_password_group.hidden = false;
    delete_button.hidden = true;

    flash_message();
    update_form_errors_message();
    update_users_field();
    username.focus({ preventScroll: true });
}

async function update_users_field() {
    const users_list = document.getElementById("users");
    while(users_list.firstChild) {
        users_list.removeChild(users_list.firstChild);
    }

    let option = document.createElement("option");
    option.value = 0;
    option.innerText = "Novo Usuário";
    
    users_list.appendChild(option);

    await fetch(`/api/users`)
    .then(response => response.json())
    .then(response => {
        if(response) {
            for(const user of response.users) {
                let option = document.createElement("option");
                option.value = user.id;
                option.innerText = `${user.username}`;
                users_list.appendChild(option);
            }
        }
    });
}

document.getElementById("users").addEventListener("change", update_user_data);

reset_users_form();