async function show_services(cell) {
    if(technicians.length === 0) { return; }

    const modal_title = document.getElementById("modal_title");
    const modal_services_list = document.getElementById("modal_services_list_group");
    const modal_services_form = document.getElementById("services_page_content");
    const modal_body = document.getElementById("modal_body");
    
    const service_repeat_button = document.getElementById("service_repeat_group");
    service_repeat_button.hidden = false;

    // const date = document.getElementById("date");
    // const group_date_first = document.getElementById("group_date_first");
    // date.setAttribute("max", week_dates[week_dates.length - 1]);
    // group_date_first.setAttribute("max", week_dates[week_dates.length - 1]);

    const save_button = document.getElementById("save_button");
    save_button.setAttribute("onclick", "send_form('SAVE', true)");

    const delete_button = document.getElementById("delete_button");
    delete_button.setAttribute("onclick", "send_form('SAVE', true)");

    modal_services_form.hidden = true;
    modal_services_list.hidden = false;
    modal_body.hidden = false;

    const cell_scope = cell.getAttribute('scope');
    if(cell_scope === "col") {
        let date = cell.id;
        update_modal_services_list("", date);
        update_modal_services_form("", date);

        modal_title.innerText = invert_date(date);
        show_modal("SERVICES_LIST");

        // console.log("Tipo Date");
        // console.log(date);

    } else if(cell_scope === "row") {
        let technician = cell.id;
        update_modal_services_list(technician, "");
        update_modal_services_form(technician, "");

        modal_title.innerText = technician;
        show_modal("SERVICES_LIST");

        // console.log("Tipo Tec");
        // console.log(technician);

    } else {
        let [technician, date] = cell.id.split("_");
        update_modal_services_list(technician, date);
        update_modal_services_form("", date);

        modal_title.innerText = `${technician} - ${invert_date(date)}`;
        show_modal("SERVICES_LIST");

        // console.log("Tipo Cell");
        // console.log(technician);
        // console.log(date);
    }

    // console.log(services);
    // console.log(technicians);

    //show_modal("SERVICES_LIST");
}

function show_modal(display="") {
    const modal_services_list = document.getElementById("modal_services_list_group");
    const modal_services_form = document.getElementById("services_page_content");
    const modal_body = document.getElementById("modal_body");
    const modal_button_back = document.getElementById("modal_button_back");

    switch(display) {
        case "SERVICES_LIST":
            modal_button_back.hidden = true;
            modal_services_list.hidden = false;
            modal_services_form.hidden = true;
            modal_body.hidden = false;
            $('#modal').modal('show');
            break;
        case "SERVICES_FORM":
            modal_button_back.hidden = false;
            modal_services_list.hidden = true;
            modal_services_form.hidden = false;
            modal_body.hidden = false;
            $('#modal').modal('show');
            if(document.getElementById("services").value == '0') { document.getElementById("address").focus(); }
            break;
        case "SERVICES_RESUME":
            modal_button_back.hidden = false;
            modal_services_list.hidden = true;
            modal_services_form.hidden = true;
            modal_body.hidden = false;
            $('#modal').modal('show');
            break;
        default:
            $('#modal').modal('hide');
            modal_button_back.hidden = true;
            modal_services_form.hidden = true;
            modal_services_list.hidden = true;
            modal_body.hidden = true;
    }
}

function hide_modal() {
    $('#modal').modal('hide');
}

function toggle_modal() {
    $('#modal').modal('toggle');
}

async function update_schedule() {
    //  Atualiza os Serviços e Técnicos, e para a atualização da tabela, caso haja erro
    let update_services_ok;
    let update_technicians_ok;
    await update_services().then(response => { update_services_ok = response; });
    await update_technicians().then(response => { update_technicians_ok = response; });
    if(!update_services_ok || !update_technicians_ok) { return -1; }
    
    // Cria uma linha de "Sem Técnicos" na tabela, caso haja serviços sem técnicos associados
    let service_without_technicians = false;
    let services_without_technicians_ids_list = [];

    const not_technicians_tr = document.createElement('tr');
    const no_technicians_th = document.createElement('th');
    no_technicians_th.id = "no_technician";
    no_technicians_th.setAttribute("onclick", "show_services(this)");
    no_technicians_th.setAttribute("scope", "row");
    no_technicians_th.setAttribute("class", "border border-secondary schedule-table-col-t");
    no_technicians_th.innerText = "Sem Técnico";
    not_technicians_tr.appendChild(no_technicians_th);

    // Cria as linhas dos técnicos na tabela
    const virtual_tbody = document.createElement('tbody');
    virtual_tbody.id = "schedule_table_body";
    for(const technician of technicians){
        const virtual_tr = document.createElement('tr');
        const virtual_th = document.createElement('th');
        virtual_th.id = technician.name;
        virtual_th.setAttribute("onclick", "show_services(this)");
        virtual_th.setAttribute("scope", "row");
        virtual_th.setAttribute("class", "border border-secondary schedule-table-col-t");
        virtual_th.innerText = technician.name;
        virtual_tr.appendChild(virtual_th);

        let table_column_index = 0;
        for(const date of week_dates) {
            const virtual_td = document.createElement('td');
            virtual_td.id = `${technician.name}_${date}`;
            virtual_td.setAttribute("onclick", "show_services(this)");
            virtual_td.setAttribute("class", `border border-secondary schedule-table-col-${table_column_index++}`);

            // Linha de "Sem Técnicos"
            const no_technicians_td = document.createElement('td');
            no_technicians_td.id = "no_technician";
            no_technicians_td.setAttribute("onclick", "show_services(tdis)");
            no_technicians_td.setAttribute("class", `border border-secondary schedule-table-col-${table_column_index-1}`);

            let services_titles = "";
            let services_counter = 0;
            let no_technicians_services_titles = "";
            let no_technicians_services_counter = 0;

            for(const service of services) {
                if(service.date == date) {
                    if(service.technicians.length === 0 && !services_without_technicians_ids_list.includes(service.id)) {
                        services_without_technicians_ids_list.push(service.id);

                        service_without_technicians = true;
                        if(no_technicians_services_counter == 0) {
                            no_technicians_services_titles += service.title;
                        }

                        no_technicians_services_counter++;
                        continue;
                    }

                    if(service.technicians.includes(technician.id)) {
                        if(services_counter == 0) {
                            services_titles += service.title;
                        }

                        services_counter++;
                    }
                }
            }

            if(services_counter > 1) {
                services_titles += `\n(+${services_counter-1})`;
            }

            if(no_technicians_services_counter > 1) {
                no_technicians_services_titles += `\n(+${no_technicians_services_counter-1})`;
            }

            virtual_td.innerText = services_titles;
            virtual_tr.appendChild(virtual_td);

            no_technicians_td.innerText = no_technicians_services_titles;
            not_technicians_tr.appendChild(no_technicians_td);
        }

        virtual_tbody.appendChild(virtual_tr);
    }

    if(service_without_technicians) {
        virtual_tbody.appendChild(not_technicians_tr);
    }

    const tbody = document.getElementById("schedule_table_body");
    document.getElementById("schedule_table").replaceChild(virtual_tbody, tbody);

    //console.log("Agenda Atualizada!")
}

async function update_services() {
    let connectionOK = true;
    await fetch(`/api/services?start_date=${week_dates[0]}&stop_date=${week_dates[week_dates.length - 1]}`)
        .then(response => response.json())
        .then(response => {
            // console.log("Atualizando Serviços...");
            services = response.services;
        })
        .catch(error => {
            let message = "Erro ao atualizar os serviços\nTentando denovo...\n";
            console.error(message, error);
            connectionOK = false;
        });
    
    return connectionOK;
}

async function update_technicians() {
    let connectionOK = true;
    let technicians_list = [];
    await fetch(`/api/users?level=TECNICO`)
        .then(response => response.json())
        .then(response => {
            // console.log("Atualizando Técnicos...");
            for(const user of response.users) {
                technicians_list.push({'id': user.id, 'name': user.username})
            }
            technicians = technicians_list;
        })
        .catch(error => {
            let message = "Erro ao atualizar os técnicos\nTentando denovo...\n";
            console.error(message, error);
            connectionOK = false;
        });
    
    return connectionOK;
}


function update_modal_services_form(technician, date) {
    // O parâmetro "true" impede atualizações assíncronas
    reset_services_form(true);

    const services_list = document.getElementById("services");
    while(services_list.firstChild) {
        services_list.removeChild(services_list.firstChild);
    }

    if(!date || new Date(date) >= new Date(today())) {
        let option = document.createElement("option");
        option.value = 0;
        option.innerText = "Novo Serviço";
        services_list.appendChild(option);
    }

    let last_group;
    for(const service of services.toSorted((a, b) => a.date.localeCompare(b.date)).toSorted((a, b) => a.group.localeCompare(b.group))) {
        if(technician) {
            if(!service.technicians.includes(technicians.find(item => item.name === technician).id)) {
                continue;
            }
        }
        if(date) {
            if(date != service.date) {
                continue;
            }
        }

        if(service.group === "" || service.group != last_group) {
            let separator = document.createElement("hr");
            services_list.appendChild(separator);
        }

        let option = document.createElement("option");
        option.value = service.id;
        option.innerText = `${service.title}`;
        if(!date) {
            option.innerText += ` (${invert_date(service.date)})`;
        }
        if(service.technicians.length === 0) {
            option.innerText += " --( Sem Técnico )--";
        }
        services_list.appendChild(option);

        last_group = service.group;
    }
}

function update_modal_services_list(technician, date) {
    // console.log("Atualizando a lista de serviços do modal...");
    // console.log(technician);
    // console.log(date);

    const services_list = document.getElementById("modal_services_list_group");
    while(services_list.firstChild) {
        services_list.removeChild(services_list.firstChild);
    }

    let button = document.createElement("button");
    button.classList.add("list-group-item", "list-group-item-action");
    if(!date || new Date(date) >= new Date(today())) {
        button.setAttribute("onclick", `set_form_service(0, "${date}", "${technician}")`);
        button.innerText = "Novo Serviço";
    } else if(technician) {
        const services_list = services.filter(service => service.date === date);
        const service = services_list.find(service => service.technicians.includes(technicians.find(item => item.name === technician).id));
        if(!service) {
            button.innerText = "Não houve serviços nesse dia";
        }
    } else {
        if(!services.filter(service => service.date === date).length) {
            button.innerText = "Não houve serviços nesse dia";
        }
    }

    if(button.innerText) { services_list.appendChild(button); }

    let last_group;
    for(const service of services.toSorted((a, b) => a.date.localeCompare(b.date)).toSorted((a, b) => a.group.localeCompare(b.group))) {
        if(technician) {
            if(!service.technicians.includes(technicians.find(item => item.name === technician).id)) {
                continue;
            }
        }

        if(date) {
            if(date != service.date) {
                continue;
            }
        }

        let button = document.createElement("button");
        button.classList.add("list-group-item", "list-group-item-action");
        if(date) { button.setAttribute("onclick", `set_form_service(${service.id}, "${date}")`); }
        else { button.setAttribute("onclick", `set_form_service(${service.id}, "${service.date}")`); }        
        button.innerText = `${service.title}`;
        // if(service.description) { button.innerText += ` -> ${service.description}`; }
        if(!date) {
            button.innerText = `(${invert_date(service.date)}) ${button.innerText}`;
        }

        services_list.appendChild(button);
    }
}

async function set_form_service(id, date, technician) {
    if(!date || new Date(date) >= new Date(today())) {
        const services_list = document.getElementById("services");
        services_list.value = id;
        await update_service_data(true);

        const calendar = document.getElementById("date");
        calendar.value = date;
        // calendar.setAttribute("min", date);
        // calendar.setAttribute("max", date);

        const checkbox = document.getElementById(`technicians-${technicians.findIndex(item => item.name === technician)}`);
        if(checkbox) { checkbox.checked = true; }

        show_modal("SERVICES_FORM");
    }
    else {


        show_modal("SERVICES_RESUME");
    }
}

update_schedule();
let intervalId = setInterval(update_schedule, 5000);

document.getElementById("main_flash_message").scrollIntoView({ block: 'end' });