async function show_services(cell) {
    if(technicians.length === 0) { return; }

    const modal_title = document.getElementById("modal_title");
    const modal_services_list = document.getElementById("modal_services_list_group");
    const modal_services_form = document.getElementById("services_page_content");
    const modal_body = document.getElementById("modal_body");
    
    const service_repeat_button = document.getElementById("service_repeat_group");
    if(service_repeat_button) { service_repeat_button.hidden = false; }

    // const date = document.getElementById("date");
    // const group_date_first = document.getElementById("group_date_first");
    // date.setAttribute("max", week_dates[week_dates.length - 1]);
    // group_date_first.setAttribute("max", week_dates[week_dates.length - 1]);

    const save_button = document.getElementById("save_button");
    if(save_button) { save_button.setAttribute("onclick", "send_form('SAVE', true)"); }

    const delete_button = document.getElementById("delete_button");
    if(delete_button) { delete_button.setAttribute("onclick", "send_form('DELETE', true)"); }

    if(modal_services_form) { modal_services_form.hidden = true; }
    modal_services_list.hidden = false;
    modal_body.hidden = false;

    const cell_scope = cell.getAttribute('scope');
    if(cell_scope === "col") {
        let date = cell.id;
        update_modal_services_list("", date);
        if(current_user.level <=2) { update_modal_services_form("", date); }

        modal_context = invert_date(date);
        modal_title.innerText = modal_context;
        show_modal("SERVICES_LIST");

        // console.log("Tipo Date");
        // console.log(date);

    } else if(cell_scope === "row") {
        let technician = cell.id;
        update_modal_services_list(technician, "");
        if(current_user.level <=2) { update_modal_services_form(technician, ""); }

        if(technician == "noTechnician") {
            modal_context = "Sem Técnico";
        } else {
            modal_context = technician;
        }

        modal_title.innerText = modal_context;
        show_modal("SERVICES_LIST");

        // console.log("Tipo Tec");
        // console.log(technician);

    } else {
        let [technician, date] = cell.id.split("_");
        update_modal_services_list(technician, date);
        if(current_user.level <=2) { update_modal_services_form("", date); }

        if(technician == "noTechnician") {
            modal_context = `Sem Técnico - ${invert_date(date)}`;
        } else {
            modal_context = `${technician} - ${invert_date(date)}`;
        }

        modal_title.innerText = modal_context;
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
    const modal_title = document.getElementById("modal_title");
    const modal_services_list = document.getElementById("modal_services_list_group");
    const modal_services_resume = document.getElementById("modal_services_resume_group");
    const modal_services_report = document.getElementById("modal_services_report_group");
    const modal_services_form = document.getElementById("services_page_content");
    const modal_services_report_result = document.getElementById("report_result_group");
    const modal_body = document.getElementById("modal_body");
    const modal_button_back = document.getElementById("modal_button_back");

    switch(display) {
        case "SERVICES_LIST":
            modal_title.innerText = modal_context;
            modal_button_back.hidden = true;
            modal_services_list.hidden = false;
            modal_services_resume.hidden = true;
            if(modal_services_report) { modal_services_report.hidden = true; }
            if(modal_services_report_result) { modal_services_report_result.hidden = true; }
            if(modal_services_form) { modal_services_form.hidden = true; }
            modal_body.hidden = false;
            $('#modal').modal('show');
            break;
        case "SERVICES_FORM":
            modal_button_back.hidden = false;
            modal_services_list.hidden = true;
            modal_services_resume.hidden = true;
            if(modal_services_report) { modal_services_report.hidden = true; }
            if(modal_services_report_result) { modal_services_report_result.hidden = true; }
            if(modal_services_form) { modal_services_form.hidden = false; }
            modal_body.hidden = false;
            $('#modal').modal('show');
            if(document.getElementById("services").value == '0') { document.getElementById("address").focus(); }
            break;
        case "SERVICES_RESUME":
            modal_button_back.hidden = false;
            modal_services_list.hidden = true;
            modal_services_resume.hidden = false;
            if(modal_services_report) { modal_services_report.hidden = true; }
            if(modal_services_report_result) { modal_services_report_result.hidden = true; }
            if(modal_services_form) { modal_services_form.hidden = true; }
            modal_body.hidden = false;
            $('#modal').modal('show');
            break;
        case "SERVICES_REPORT":
            modal_title.innerText = "Relatório de Dias Trabalhados";
            modal_button_back.hidden = true;
            modal_services_list.hidden = true;
            modal_services_resume.hidden = true;
            if(modal_services_report) { modal_services_report.hidden = false; }
            if(modal_services_report_result) { modal_services_report_result.hidden = true; }
            if(modal_services_form) { modal_services_form.hidden = true; }
            modal_body.hidden = false;
            $('#modal').modal('show');
            break;
        default:
            $('#modal').modal('hide');
            modal_button_back.hidden = true;
            modal_services_list.hidden = true;
            modal_services_resume.hidden = true;
            if(modal_services_report) { modal_services_report.hidden = true; }
            if(modal_services_report_result) { modal_services_report_result.hidden = true; }
            if(modal_services_form) { modal_services_form.hidden = true; }
            modal_body.hidden = true;
            modal_context = "";
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
    no_technicians_th.id = "noTechnician";
    no_technicians_th.setAttribute("onclick", "show_services(this)");
    no_technicians_th.setAttribute("scope", "row");
    no_technicians_th.setAttribute("class", "border border-secondary schedule-table-col-t");
    no_technicians_th.innerText = "Sem Técnico";
    not_technicians_tr.appendChild(no_technicians_th);

    // Cria as linhas dos técnicos na tabela
    const virtual_tbody = document.createElement('tbody');
    virtual_tbody.id = "schedule_table_body";

    let technicians_list;
    if(current_user.level === 3) { technicians_list = [technicians.find(technician => technician.id === current_user.id)]; }
    else { technicians_list = technicians; }
    for(const technician of technicians_list){
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
            if(date === today()) {
                virtual_td.setAttribute("class", "border border-secondary table-col-selected-day");
                table_column_index++;
            } else {
                virtual_td.setAttribute("class", `border border-secondary schedule-table-col-${table_column_index++}`);
            }

            // Linha de "Sem Técnicos"
            const no_technicians_td = document.createElement('td');
            no_technicians_td.id = `noTechnician_${date}`;
            no_technicians_td.setAttribute("onclick", "show_services(this)");
            if(date === today()) {
                no_technicians_td.setAttribute("class", "border border-secondary table-col-selected-day");
            } else {
                no_technicians_td.setAttribute("class", `border border-secondary schedule-table-col-${table_column_index-1}`);
            }

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

    table_column_index = 0;
    for(date of week_dates) {
        let column_header = document.querySelector(`[id="${date}"]`);
        if(date === today()) {
            column_header.setAttribute("class", "border border-secondary table-col-selected-day");
            table_column_index++;
        } else {
            column_header.setAttribute("class", `border border-secondary schedule-table-col-${table_column_index++}`);
        }
    }

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

    // if(!date || new Date(date) >= new Date(today())) {
    //     let option = document.createElement("option");
    //     option.value = 0;
    //     option.innerText = "Novo Serviço";
    //     services_list.appendChild(option);
    // }

    let option = document.createElement("option");
    option.value = 0;
    option.innerText = "Novo Serviço";
    services_list.appendChild(option);

    let last_group;
    for(const service of services.toSorted((a, b) => a.date.localeCompare(b.date)).toSorted((a, b) => a.group.localeCompare(b.group))) {
        if(technician && technician != "noTechnician") {
            if(!service.technicians.includes(technicians.find(item => item.name === technician).id)) {
                continue;
            }
        }
        if(technician && technician == "noTechnician") {
            if(service.technicians.length > 0) {
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
    if(current_user.level <= 2) {
        if(!date || new Date(date) >= new Date(today())) {
            if(technician && technician != "noTechnician") {
                button.setAttribute("onclick", `set_service(0, "${date}", "${technician}")`);
                button.innerText = "Novo Serviço";
            } else if(date && !technician) {
                button.setAttribute("onclick", `set_service(0, "${date}", "${technician}")`);
                button.innerText = "Novo Serviço";
            } else if(date && technician && technician == "noTechnician") {
                const services_list = services.filter(service => service.date === date);
                const service = services_list.find(service => service.technicians.length === 0);
                if(!service) {
                    button.innerText = "Nenhum Serviço";
                }                
            }
        } else if(technician && technician != "noTechnician") {
            const services_list = services.filter(service => service.date === date);
            const service = services_list.find(service => service.technicians.includes(technicians.find(item => item.name === technician).id));
            // if(!service) {
            //     button.innerText = "Não houve serviços nesse dia";
            // }
            button.setAttribute("onclick", `set_service(0, "${date}", "${technician}")`);
            button.innerText = "Novo Serviço";
        } else if(technician && technician == "noTechnician") {
            const services_list = services.filter(service => service.date === date);
            const service = services_list.find(service => service.technicians.length == 0);
            if(!service) {
                button.innerText = "Não houve serviços nesse dia";
            }
        } else if(!technician) {
            const services_list = services.filter(service => service.date === date);
            const service = services_list.find(service => service.technicians.length == 0);
            // if(!service) {
            //     button.innerText = "Não houve serviços nesse dia";
            // }
            button.setAttribute("onclick", `set_service(0, "${date}", "${technician}")`);
            button.innerText = "Novo Serviço";
        } else {
            // if(!services.filter(service => service.date === date).length) {
            //     button.innerText = "Não houve serviços nesse dia";
            // }
            button.setAttribute("onclick", `set_service(0, "${date}", "${technician}")`);
            button.innerText = "Novo Serviço";
        }
    } else {
        if(!date && services.length === 0) {
            button.innerText = "Nenhum serviço para essa semana";
        } else if(date && new Date(date) < new Date(today()) && !services.find(item => item.date === date)) {
            button.innerText = "Não houve serviços nesse dia";
        } else if(date && !services.find(item => item.date === date)) {
            button.innerText = "Nenhum Serviço";
        }
    }

    if(button.innerText) { services_list.appendChild(button); }

    if(current_user.level <= 2) {
        let services_sorted = services.toSorted((a, b) => a.date.localeCompare(b.date));
        if(date) { services_sorted = services_sorted.filter(service => service.date === date); }
        if(technician && technician != "noTechnician") { services_sorted = services_sorted.filter(service => service.technicians.includes(technicians.find(item => item.name === technician).id)); }
        if(technician && technician == "noTechnician") { services_sorted = services_sorted.filter(service => service.technicians.length == 0); }

        for(const service of services_sorted) {
            let button = document.createElement("button");
            button.classList.add("list-group-item", "list-group-item-action");
            if(date) { button.setAttribute("onclick", `set_service(${service.id}, "${date}")`); }
            else { button.setAttribute("onclick", `set_service(${service.id}, "${service.date}")`); }        
            button.innerText = `${service.title}`;
            // if(service.description) { button.innerText += ` -> ${service.description}`; }
            if(!date) {
                button.innerText = `(${invert_date(service.date)}) ${button.innerText}`;
            }

            services_list.appendChild(button);
        }
    } else {
        for(const service of services.toSorted((a, b) => a.date.localeCompare(b.date))) {
            if(date) {
                if(date != service.date) { continue; }
            }

            if(!date && technician) {
                if(new Date(service.date) < new Date(today())) { continue; }
            }

            let button = document.createElement("button");
            button.classList.add("list-group-item", "list-group-item-action");
            if(date) { button.setAttribute("onclick", `set_service(${service.id}, "${date}")`); }
            else { button.setAttribute("onclick", `set_service(${service.id}, "${service.date}")`); }        
            button.innerText = `${service.title}`;
            // if(service.description) { button.innerText += ` -> ${service.description}`; }
            if(!date) {
                button.innerText = `(${invert_date(service.date)}) ${button.innerText}`;
            }

            services_list.appendChild(button);
        }
    }
}

async function set_service(id, date, technician) {
    if(current_user.level <= 2) {
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

        //     const modal_title = document.getElementById("modal_title");
        //     let service = services.find(service => service.id === id);
        //     modal_title.innerText = service.title;

        //     let virtual_resume = document.createElement("div");
        //     virtual_resume.id = "services_resume_body";
        //     virtual_resume.classList.add("p-3");
        //     let virtual_dl;
        //     let service_technicians_list = [];
        //     services.find(service => service.id === id).technicians.forEach(id => service_technicians_list.push(technicians.find(item => item.id === id).name));
        //     for(const item of [
        //         ["Endereço", service.address],
        //         ["Data", invert_date(service.date)],
        //         ["Técnicos", service_technicians_list.sort().join("\n")],
        //         ["Serviço", service.description]
        //     ]) {
        //         virtual_dl = document.createElement("dl");
        //         virtual_dl.classList.add("row");
        //         let virtual_dt = document.createElement("dt");
        //         virtual_dt.classList.add("col-sm-2");
        //         virtual_dt.innerText = item[0];
        //         let virtual_dd = document.createElement("dd");
        //         virtual_dd.classList.add("col-sm-12");
        //         virtual_dd.innerText = item[1];
        //         virtual_dl.appendChild(virtual_dt);
        //         virtual_dl.appendChild(virtual_dd);
        //         virtual_resume.append(virtual_dl);
        //     }

        // let resume = document.getElementById("services_resume_body");
        // document.getElementById("modal_services_resume_group").replaceChild(virtual_resume, resume)

        //     show_modal("SERVICES_RESUME");
        }
    } else {
        let modal_title = document.getElementById("modal_title");
        let service = services.find(service => service.id === id);
        modal_title.innerText = service.title;

        let virtual_resume = document.createElement("div");
        virtual_resume.id = "services_resume_body";
        virtual_resume.classList.add("p-3");
        let virtual_dl;
        let service_technicians_list = [];
        services.find(service => service.id === id).technicians.forEach(id => service_technicians_list.push(technicians.find(item => item.id === id).name));
        for(const item of [
            ["OS", service.os],
            ["Data", invert_date(service.date)],
            ["Técnicos", service_technicians_list.sort().join("\n")],
            ["Serviço", service.description],
            ["Endereço", service.address],
            ["Navegação", null]
        ]) {
            virtual_dl = document.createElement("dl");
            virtual_dl.classList.add("row");
            let virtual_dt = document.createElement("dt");
            virtual_dt.classList.add("col-sm-2");
            virtual_dt.innerText = item[0];
            let virtual_dd = document.createElement("dd");
            virtual_dd.classList.add("col-sm-12");
            if(item[0] === "Endereço") {
                // const a = document.createElement("a");
                // a.setAttribute("target", "_blank");
                // a.setAttribute("rel", "noopener noreferrer");
                // // a.setAttribute("href", `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(service.address)}`);
                // a.setAttribute("href", `waze://www.google.com/waze/search/?api=1&query=${encodeURIComponent(service.address)}`)
                // a.innerText = item[1];
                // virtual_dd.appendChild(a);
                virtual_dd.innerText = item[1];
                virtual_dl.appendChild(virtual_dt);
                virtual_dl.appendChild(virtual_dd);
            } else if(item[0] === "Navegação") {
                const buttons_div = document.createElement("div");
                buttons_div.id = "navigation_buttons";
                buttons_div.classList.add("inline");
                
                const maps_button = document.createElement("button");
                maps_button.type = "button";
                maps_button.id = "maps_button";
                maps_button.innerText = "MAPS";
                maps_button.classList.add("btn", "btn-primary", "inline-block");
                maps_button.setAttribute("onclick", `open_navigation('maps', '${service.address}')`);
                let individual_button_div = document.createElement("div");
                individual_button_div.style.display = "inline-block";
                individual_button_div.appendChild(maps_button);
                buttons_div.appendChild(individual_button_div);
                
                const waze_button = document.createElement("button");
                waze_button.type = "button";
                waze_button.id = "waze_button";
                waze_button.innerText = "WAZE";
                waze_button.classList.add("btn", "btn-primary", "inline-block");
                waze_button.setAttribute("onclick", `open_navigation('waze', '${service.address}')`);
                individual_button_div = document.createElement("div");
                individual_button_div.style.display = "inline-block";
                individual_button_div.style.marginLeft = "10px";
                individual_button_div.appendChild(waze_button);
                buttons_div.appendChild(individual_button_div);

                virtual_dl.appendChild(buttons_div);
            } else {
                virtual_dd.innerText = item[1];
                virtual_dl.appendChild(virtual_dt);
                virtual_dl.appendChild(virtual_dd);
            }
            virtual_resume.append(virtual_dl);
        }

        let resume = document.getElementById("services_resume_body");
        document.getElementById("modal_services_resume_group").replaceChild(virtual_resume, resume)

        show_modal("SERVICES_RESUME");
    }
}

function open_navigation(app, address) {
    switch(app) {
        case "maps":
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
            break;
        case "waze":
            window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`, "_blank");
            break;
        default:
            break;
    }
}

function show_report() {
    const date_start = document.getElementById("report_date_start");
    date_start.removeAttribute("min");
    date_start.removeAttribute("max");
    date_start.value = "";

    const date_stop = document.getElementById("report_date_stop");
    date_stop.removeAttribute("min");
    date_stop.removeAttribute("max");
    date_stop.value = "";

    modal_context = "REPORT";
    show_modal("SERVICES_REPORT");
}

async function generate_report() {
    const report_result = document.getElementById("report_result_group");
    const date_start = document.getElementById("report_date_start");
    const date_stop = document.getElementById("report_date_stop");

    let report_services;
    if(date_start.value && date_stop.value) {
        await fetch(`/api/services?start_date=${date_start.value}&stop_date=${date_stop.value}`)
            .then(response => response.json())
            .then(response => {
                report_services = response.services;
            })
            .catch(error => {
                let message = "Erro ao ler os serviços da data indicada!\n";
                console.error(message, error);
            });
    } else {
        let errors = [];

        if(!date_start.value) { errors.push({"id": "report_date_start", "message": "Escolha uma data inicial"}); }
        else { errors.push({"id": "report_date_start", "message": ""}); }

        if(!date_stop.value) { errors.push({"id": "report_date_stop", "message": "Escolha uma data final"}); }
        else { errors.push({"id": "report_date_stop", "message": ""}); }

        update_date_errors_message(errors);

        return;
    }

    let holidays = [];
    await fetch(`https://brasilapi.com.br/api/feriados/v1/${new Date().getFullYear()}`)
        .then(response => response.json())
        .then(response => {
            holidays = response;
        })
        .catch(error => {
            let message = "Erro ao acessar a API de feriados nacionais!\n";
            console.error(message, error);
        });
    //console.log(holidays);

    update_date_errors_message();

    let holidays_of_period = [];
    holidays.forEach(holiday => { if(holiday.date >= date_start.value && holiday.date <= date_stop.value) { holidays_of_period.push(holiday); } });
    holidays_of_period = [...new Set(holidays_of_period)]; // Remove duplicidades
    // console.log(holidays_of_period);

    let technicians_report = [];
    technicians.forEach(technician => {
        technicians_report.push({name: technician.name, working_days: 0, saturdays: 0, sundays: 0, holidays: 0});
        let last_date = "";
        for(const service of report_services.toSorted((a, b) => a.date.localeCompare(b.date))) {
            if(service.technicians.includes(technician.id)) {
                if(service.date === last_date) {
                    continue;
                }
                const date = new Date(service.date);
                const date_iso = date.toISOString().split("T")[0];
                if(holidays.find(holiday => holiday.date === date_iso)) { technicians_report[technicians_report.length - 1].holidays += 1; }
                else if(date.getDay() === 5) { technicians_report[technicians_report.length - 1].saturdays += 1; }
                else if(date.getDay() === 6) { technicians_report[technicians_report.length - 1].sundays += 1; }
                else { technicians_report[technicians_report.length - 1].working_days += 1; }
                last_date = service.date;
            }
        }
    })
    // console.log(technicians_report);

    // Tabela com os resultados
    if(document.getElementById("report_table")) { report_result.removeChild(document.getElementById("report_table")); }

    const report_table = document.createElement("table");
    report_table.id = "report_table";
    report_table.classList.add("table", "table-success");

    let tr = document.createElement("tr");

    let th = document.createElement("th");
    th.scope = "col";
    th.innerText = "Técnicos";
    tr.appendChild(th);

    th = document.createElement("th");
    th.scope = "col";
    th.innerText = "Dias Úteis";
    tr.appendChild(th);

    th = document.createElement("th");
    th.scope = "col";
    th.innerText = "Sábados";
    tr.appendChild(th);

    th = document.createElement("th");
    th.scope = "col";
    th.innerText = "Domingos";
    tr.appendChild(th);

    if(holidays) {
        th = document.createElement("th");
        th.scope = "col";
        th.innerText = "Feriados\n(Nacionais)";
        tr.appendChild(th);
    }

    let thead = document.createElement("thead");
    thead.appendChild(tr);

    report_table.appendChild(thead);

    let td;
    let tbody = document.createElement("tbody");
    for(const report of technicians_report) {
        tr = document.createElement("tr");

        th = document.createElement("th");
        th.scope="row";
        th.innerText = report.name;
        tr.appendChild(th);

        td = document.createElement("td");
        td.innerText = report.working_days;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerText = report.saturdays;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerText = report.sundays;
        tr.appendChild(td);

        if(holidays) {
            td = document.createElement("td");
            td.innerText = report.holidays;
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    report_table.appendChild(tbody);

    report_result.appendChild(report_table);

    let report_span_div = document.getElementById("holiday_report_span");
    if(report_span_div) { report_result.removeChild(report_span_div); }

    if(holidays_of_period.length > 0) {
        report_span_div = document.createElement("div");
        report_span_div.id = "holiday_report_span";
        report_span_div.setAttribute("style", "margin-left: 10px;");

        let report_span = document.createElement("span");
        report_span.innerText = "* Feriados Nacionais do Período Selecionado";
        report_span_div.appendChild(report_span);

        holidays_of_period.forEach(holiday => {
            report_span = document.createElement("span");
            report_span.innerText += `\n${invert_date(holiday.date)} - ${holiday.name}`;
            report_span_div.appendChild(report_span);
        });

        report_result.appendChild(report_span_div);
    }

    report_result.hidden = false;
}

function update_date_errors_message(errors=[
                                        {"id": "report_date_start", "message": ""},
                                        {"id": "report_date_stop", "message": ""}
                                    ]) {
    let first_item_focus = false;
    for(const item of errors) {
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

async function show_next_services() {
    let next_services;
    await fetch(`/api/services?start_date=${today()}`)
        .then(response => response.json())
        .then(response => {
            next_services = response.services.toSorted((a, b) => a.date.localeCompare(b.date));
        })
        .catch(error => {
            let message = "Erro ao pesquisar os próximos serviços!\n";
            console.error(message, error);
        });
    // console.log(next_services);

    const services_list = document.getElementById("modal_services_list_group");
    while(services_list.firstChild) {
        services_list.removeChild(services_list.firstChild);
    }

    if(next_services.length > 0) {
        next_services.forEach(service => {
            const button = document.createElement("button");
            button.classList.add("list-group-item", "list-group-item-action");
            button.setAttribute("onclick", `set_next_service_form(${service.id})`);
            button.innerText = `(${invert_date(service.date)}) ${service.title}`;
            services_list.appendChild(button);
        });
    } else {
        const button = document.createElement("button");
        button.classList.add("list-group-item", "list-group-item-action");
        button.innerText = "Não há serviços agendados";
        services_list.appendChild(button);
    }

    modal_context = "Próximos Serviços";
    show_modal("SERVICES_LIST");
}

async function set_next_service_form(id) {
    let service;
    await fetch(`/api/services?id=${id}`)
        .then(response => response.json())
        .then(response => {
            service = response;
        })
        .catch(error => {
            let message = "Erro ao pesquisar os próximos serviços!\n";
            console.error(message, error);
        });
    //console.log(service);

    let modal_title = document.getElementById("modal_title");
    modal_title.innerText = service.title;

    let virtual_resume = document.createElement("div");
    virtual_resume.id = "services_resume_body";
    virtual_resume.classList.add("p-3");
    let virtual_dl;
    let service_technicians_list = [];
    service.technicians.forEach(id => { service_technicians_list.push(technicians.find(technician => technician.id.toString() === id).name); });
    for(const item of [
        ["OS", service.os],
        ["Data", invert_date(service.date)],
        ["Técnicos", service_technicians_list.sort().join("\n")],
        ["Serviço", service.description],
        ["Endereço", service.address],
        ["Navegação", null]
    ]) {
        virtual_dl = document.createElement("dl");
        virtual_dl.classList.add("row");
        let virtual_dt = document.createElement("dt");
        virtual_dt.classList.add("col-sm-2");
        virtual_dt.innerText = item[0];
        let virtual_dd = document.createElement("dd");
        virtual_dd.classList.add("col-sm-12");
        if(item[0] === "Endereço") {
            virtual_dd.innerText = item[1];
            virtual_dl.appendChild(virtual_dt);
            virtual_dl.appendChild(virtual_dd);
        } else if(item[0] === "Navegação") {
            const buttons_div = document.createElement("div");
            buttons_div.id = "navigation_buttons";
            buttons_div.classList.add("inline");
            
            const maps_button = document.createElement("button");
            maps_button.type = "button";
            maps_button.id = "maps_button";
            maps_button.innerText = "MAPS";
            maps_button.classList.add("btn", "btn-primary", "inline-block");
            maps_button.setAttribute("onclick", `open_navigation('maps', '${service.address}')`);
            let individual_button_div = document.createElement("div");
            individual_button_div.style.display = "inline-block";
            individual_button_div.appendChild(maps_button);
            buttons_div.appendChild(individual_button_div);
            
            const waze_button = document.createElement("button");
            waze_button.type = "button";
            waze_button.id = "waze_button";
            waze_button.innerText = "WAZE";
            waze_button.classList.add("btn", "btn-primary", "inline-block");
            waze_button.setAttribute("onclick", `open_navigation('waze', '${service.address}')`);
            individual_button_div = document.createElement("div");
            individual_button_div.style.display = "inline-block";
            individual_button_div.style.marginLeft = "10px";
            individual_button_div.appendChild(waze_button);
            buttons_div.appendChild(individual_button_div);

            virtual_dl.appendChild(buttons_div);
        } else {
            virtual_dd.innerText = item[1];
            virtual_dl.appendChild(virtual_dt);
            virtual_dl.appendChild(virtual_dd);
        }
        virtual_resume.append(virtual_dl);
    }

    let resume = document.getElementById("services_resume_body");
    document.getElementById("modal_services_resume_group").replaceChild(virtual_resume, resume)

    show_modal("SERVICES_RESUME");
}

if(current_user.level <= 2) {
    document.getElementById("report_date_start").addEventListener("change", function() {
        const date_start = document.getElementById("report_date_start");
        const date_stop = document.getElementById("report_date_stop");

        date_stop.setAttribute("min", date_start.value);
    });

    document.getElementById("report_date_stop").addEventListener("change", function() {
        const date_start = document.getElementById("report_date_start");
        const date_stop = document.getElementById("report_date_stop");

        date_start.setAttribute("max", date_stop.value);
    });
}

update_schedule();
let intervalId = setInterval(update_schedule, 5000);

document.getElementById("main_flash_message").scrollIntoView({ block: 'end' });