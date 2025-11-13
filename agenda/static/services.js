async function send_form(action, external_call=false) {
    update_form_errors_message();

    const service_repeat = document.getElementById("service_repeat").checked ? true : false;
    const service_id = document.getElementById("services").value;

    let date, group_date_first, group_date_last;
    if(service_repeat) {
        group_date_first = document.getElementById("group_date_first").value;
        group_date_last = document.getElementById("group_date_last").value;
        date = group_date_first;
    } else {
        date = document.getElementById("date").value;
        group_date_first = date;
        group_date_last = date;
    }

    const params = new URLSearchParams();
    params.append("csrf_token", document.getElementById("csrf_token").value);
    params.append("services", service_id);
    params.append("service_repeat", service_repeat);
    params.append("title", document.getElementById("title").value);
    params.append("date", date);
    params.append("group_date_first",group_date_first);
    params.append("group_date_last", group_date_last);
    params.append("address", document.getElementById("address").value);
    params.append("os", document.getElementById("os").value);
    params.append("equipment", document.getElementById("equipment").value);
    params.append("serial_number", document.getElementById("serial_number").value);
    params.append("description", document.getElementById("description").value.replaceAll("\t", ""));
    for(const technician of document.getElementById("technicians").querySelectorAll("input[type=checkbox]")) {
        if(technician) {
            // console.log(technician);
            if(technician.checked) {
                params.append("technicians", technician.value);
            }
        }
    }

    let method;
    if(action === "SAVE") {
        if(service_id === "0" || service_repeat) {
            method = "POST";
        }
        else {
            method = "PUT";
        }
    } else if(action === "DELETE") {
        method = "DELETE"
    } else {
        console.error("Invalid method");
        return;
    }

    // console.log(method);
    // console.log(params.toString());

    flash_message("Enviando E-Mails", "warning");

    await fetch(`/api/services`, {
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
            if(!external_call) { reset_services_form(); }
            flash_message(response.message, 'success');
        } else if(response.status == 'error') {
            flash_message();
            if(response.message == 'form_validation') {
                for(const item of response.errors) {
                    // console.log(`${item.id}: ${item.message}`);
                }
                update_form_errors_message(response.errors);
                
            } else if(response.message == 'no_technician') {
                window.location.href = "/services";
            } else {
                // console.log(response.message);
                if(!external_call) { reset_services_form(); }
                flash_message("Os dados não foram salvos", 'warning');
            }
        } else {
            if(!external_call) { reset_services_form(); }
            flash_message("Erro desconhecido", 'warning');
        }
    })
    .catch(error => {
        let message = "Houve um problema ao salvar o Serviço";
        flash_message(message, 'danger');
        console.error(message, error);
    });
}

function update_service_repeat() {
    const service_repeat = document.getElementById("service_repeat");
    const date_group = document.getElementById("date_group");
    const service_group_dates = document.getElementById("service_group_dates_group");
    
    const date = document.getElementById("date");
    const group_date_first = document.getElementById("group_date_first");
    const group_date_last = document.getElementById("group_date_last");

    if(service_repeat.checked) {
        date_group.hidden = true;
        service_group_dates.hidden = false;

        group_date_first.value = group_date_first.value ? group_date_first.value : date.value;
    } else {
        date_group.hidden = false;
        service_group_dates.hidden = true;
    }

    set_dates_limits();    
}

function set_dates_limits() {
    const date = document.getElementById("date");
    const group_date_first = document.getElementById("group_date_first");
    const group_date_last = document.getElementById("group_date_last");

    // date.setAttribute("min", today());
    // group_date_first.setAttribute("min", today());

    if(group_date_last.value) { group_date_first.setAttribute("max", group_date_last.value); }
    else { group_date_first.removeAttribute("max"); }
    
    if(group_date_first.value) { group_date_last.setAttribute("min", group_date_first.value); }
    else { group_date_last.removeAttribute("min"); }
    // else { group_date_last.setAttribute("min", today()); }
}

function update_form_errors_message(errors=[
                                        {"id": "services", "message": ""},
                                        {"id": "title", "message": ""},
                                        {"id": "date", "message": ""},
                                        {"id": "group_date_first", "message": ""},
                                        {"id": "group_date_last", "message": ""},
                                        {"id": "address", "message": ""},
                                        {"id": "os", "message": ""},
                                        {"id": "equipment", "message": ""},
                                        {"id": "serial_number", "message": ""},
                                        {"id": "description", "message": ""},
                                        {"id": "technicians", "message": ""}
                                    ]) {
    let first_item_focus = false;
    for(const item of errors) {
        if(item.id == "service_repeat") continue;
        const field = document.getElementById(item.id);
        const field_error_message = document.getElementById(`${item.id}_error_message`);
        if(item.message) {
            if(!first_item_focus) {
                field.focus();
                first_item_focus = true;
            }
            field.classList.add("is-invalid");
            field_error_message.querySelector("span").innerText = item.message;
        } else {
            field.classList.remove("is-invalid");
            field_error_message.querySelector("span").innerText = "";
        }
    }
}

function reset_services_form(external_call=false) {
    const service_repeat_label = document.querySelector("#service_repeat_group label");
    const services = document.getElementById("services");
    const service_repeat = document.getElementById("service_repeat");
    const title = document.getElementById("title");
    const date = document.getElementById("date");
    const group_date_first = document.getElementById("group_date_first");
    const group_date_last = document.getElementById("group_date_last");
    const address = document.getElementById("address");
    const os = document.getElementById("os");
    const equipment = document.getElementById("equipment");
    const serial_number = document.getElementById("serial_number");
    const description = document.getElementById("description");
    const technicians = document.querySelectorAll("#technicians input[type=checkbox]");
    const delete_button = document.getElementById("delete_button");

    service_repeat_label.innerText = "Repetir Serviço";
    delete_button.hidden = true;
    service_repeat.checked = false;
    services.value = 0;
    title.value = "";
    date.value = "";
    group_date_first.value = "";
    group_date_last.value = "";
    address.value = "";
    os.value = "";
    equipment.value = "";
    serial_number.value = "";
    description.value = "";
    technicians.forEach(item => {
        item.checked = false;
    });

    flash_message();
    set_dates_limits();
    update_service_repeat();
    update_form_errors_message();

    if(!external_call) {
        update_services_field();
        update_technicians_field();
    }
    address.focus({ preventScroll: true });
    //document.getElementById("services_form_legend").scrollIntoView({ block: 'end' });
}

function flash_message(message="", category="primary") {
    // Categorias: primary (padrão), secondary, success, danger, warning, info, light, dark
    const flash = document.getElementById("services_flash_message");
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

async function update_service_data(external_call=false) {
    flash_message();
    update_form_errors_message();
    await update_technicians_field();

    const service_repeat_label = document.querySelector("#service_repeat_group label");
    const services = document.getElementById("services").value;
    const service_repeat = document.getElementById("service_repeat");
    const title = document.getElementById("title");
    const date = document.getElementById("date");
    const group_date_first = document.getElementById("group_date_first");
    const group_date_last = document.getElementById("group_date_last");
    const address = document.getElementById("address");
    const os = document.getElementById("os");
    const equipment = document.getElementById("equipment");
    const serial_number = document.getElementById("serial_number");
    const description = document.getElementById("description");
    const technicians = document.querySelectorAll("#technicians input[type=checkbox]");
    const delete_button = document.getElementById("delete_button");

    service_repeat.checked = false;
    update_service_repeat();

    if(services != 0) {
        fetch(`/api/services?id=${services}`)
        .then(response => response.json())
        .then(service => {
            if(service) {
                if(service.group_date_first && service.group_date_last) {
                    service_repeat_label.innerText = "Atualizar Todos";
                } else {
                    service_repeat_label.innerText = "Repetir Serviço";
                }
                delete_button.hidden = false;
                title.value = service.title;
                date.value = service.date;
                group_date_first.value = service.group_date_first;
                group_date_last.value = service.group_date_last;
                address.value = service.address;
                os.value = service.os;
                equipment.value = service.equipment;
                serial_number.value = service.serial_number;
                description.value = service.description;
                technicians.forEach(item => {
                    if(service.technicians.includes(item.value)) {
                        item.checked = true;
                    }
                    else {
                        item.checked = false;
                    }
                });
            }
        });
    }
    else {
        reset_services_form(external_call);
    }
}

async function update_services_field() {
    const services_list = document.getElementById("services");
    while(services_list.firstChild) {
        services_list.removeChild(services_list.firstChild);
    }

    let option = document.createElement("option");
    option.value = 0;
    option.innerText = "Novo Serviço";
    services_list.appendChild(option);

    await fetch(`/api/services`)
    .then(response => response.json())
    .then(response => {
        if(response) {
            let last_group;
            for(const service of response.services) {
                if(service.group === "" || service.group != last_group) {
                    let separator = document.createElement("hr");
                    separator.classList.add("my-4");
                    services_list.appendChild(separator);
                }

                let option = document.createElement("option");
                option.value = service.id;
                option.innerText = `${service.title} (${service.date})`;
                if(service.technicians.length === 0) {
                    option.innerText += " --( Sem Técnico )--";
                }
                services_list.appendChild(option);

                last_group = service.group;
            }
        }
    });
}

async function update_technicians_field() {
    const technicians_list = document.getElementById("technicians");
    while(technicians_list.firstChild) {
        technicians_list.removeChild(technicians_list.firstChild)
    }

    await fetch(`/api/users?level=TECNICO`)
    .then(response => response.json())
    .then(response => {
        if(response) {
            //console.log(response);
            for(const [index, user] of response.users.entries()) {
                let label = document.createElement("label");
                label.htmlFor = `technicians-${index}`;
                label.innerText = user.username;

                let input = document.createElement("input");
                input.id = `technicians-${index}`;
                input.name = "technicians";
                input.type = "checkbox";
                input.value = user.id;

                let item = document.createElement("li");
                item.appendChild(label);
                item.appendChild(input);

                technicians_list.appendChild(item)
            }
        }
    });
}

async function set_places_auto_complete() {
    await google.maps.importLibrary("places");
    
    const input = document.getElementById("address");
    const options = {
        fields: ["name", "address_components"],
        strictBounds: false
    };

    let autoComplete = new google.maps.places.Autocomplete(input, options);
    input.value = "";

    autoComplete.addListener("place_changed", getAddress);

    function getAddress() {
        const place = autoComplete.getPlace();
        // console.log(place);

        if(!place.address_components) {
            let address = document.getElementById("address");
            address.value = "";
            address.placeholder = "Digite um local e escolha um local da lista";
            address.focus();
        } else {
            const title = document.getElementById("title");
            title.value = place.name;

            let route = "";
            let number = "";
            let sublocality = "";
            let postal_code = "";
            let city = "";
            let state = "";
            let state_short = "";
            let country = "";
            let country_short = "";

            for(const component of place.address_components) {
                // console.log(`${component.types}: ${component.long_name}`);

                if(component.types.includes("route")) { route = component.short_name; };
                if(component.types.includes("street_number")) { number = component.long_name; };
                if(component.types.includes("sublocality")) { sublocality = component.long_name; };
                if(component.types.includes("administrative_area_level_2")) { city = component.long_name; };
                if(component.types.includes("postal_code")) { postal_code = component.long_name; };
                if(component.types.includes("administrative_area_level_1")) {
                    state = component.long_name;
                    state_short = component.short_name;
                };
                if(component.types.includes("country")) {
                    country = component.long_name;
                    country_short = component.short_name;
                };
            };

            let address = "";

            if(country_short == "BR") {
                address = route;
                if(number) { address += `, ${number}`; };

                if(sublocality || city) {
                    address += " - ";
                    if(sublocality) {
                        address += `${sublocality}`;
                        if(city) { address += `, `; }
                    };
                    if(city) { address += `${city}`; };
                };

                if(state_short || postal_code || country) {
                    address += " - ";
                    if(state_short) {
                        address += `${state_short}`;
                        if(postal_code && postal_code.length === 9) { address += `, `; }
                    };
                    if(postal_code && postal_code.length === 9) { address += `${postal_code}`; };
                };

            } else {
                address = route;
                if(number) { address += `, ${number}`; };
                if(sublocality) { address += `, ${sublocality}`; };
                if(city) { address += `, ${city}`; };
                if(postal_code) { address += ` - ${postal_code}`; };
                if(state_short) { address += ` - ${state_short}`; };
                if(country_short) { address += ` - ${country_short}`; };
            };

            const address_field = document.getElementById("address");
            address_field.value = address;
            title.focus();
        }
    }
}

function clear_address_field() {
    const service_title = document.getElementById("title");
    service_title.value = "";

    const address_field = document.getElementById("address");
    address_field.value = "";
    address_field.focus();
}

function set_lab_address() {
    const service_title = document.getElementById("title");
    service_title.value = "Century Plaza Business (Prédio Comercial)";

    const address_field = document.getElementById("address");
    address_field.value = "Rua Giovanni Battista Pirelli, 271 - Vila Homero Thon, Santo André - SP, 09111-340";
    address_field.focus();
}

async function update_description() {
    // console.log("Atualizando a descrição utilizando a OS...");
    const os = document.getElementById("os").value;
    const equipment = document.getElementById("equipment");
    const serial_number = document.getElementById("serial_number");
    const description = document.getElementById("description");

    if(os) {
        await fetch(`/api/effort_description?os=${os}`)
        .then(response => response.json())
        .then(response => {
            if(Object.keys(response).length) {
                flash_message();
                response.equipment ? equipment.value = response.equipment : equipment.value = "";
                response.equipment_serial_number ? serial_number.value = response.equipment_serial_number : serial_number.value = "";
                response.technical_description ? description.value = response.technical_description : description.value = "";
            } else {
                flash_message("OS não encontrada", 'warning');
                equipment.value = "";
                serial_number.value = "";
                description.value = "";
            }
        })
        .catch(error => {
            equipment.value = "";
            serial_number.value = "";
            description.value = "";
            let message = "Houve um problema no servidor ao procurar a OS";
            flash_message(message, 'danger');
            console.error(message, error);
        });
    } else {
        flash_message();
        equipment.value = "";
        serial_number.value = "";
        description.value = "";
    }
}

set_places_auto_complete();

document.getElementById("group_date_first").addEventListener("change", set_dates_limits);
document.getElementById("group_date_last").addEventListener("change", set_dates_limits);

document.getElementById("services").addEventListener("change", update_service_data);
document.getElementById("service_repeat").addEventListener("change", update_service_repeat);

reset_services_form();