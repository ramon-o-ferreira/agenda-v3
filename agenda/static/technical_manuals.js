async function update_options(button) {
    if(button.classList.contains("active")) {
        button.classList.remove("active");
    } else {
        for(element of document.querySelectorAll("#technical_manuals_group .active")) { element.classList.remove("active"); }
        button.classList.add("active");
    }

    let starter_query = "";
    let main_zero_count = 0;
    let main_non_zero_count = 0;
    for(element of button.id.split("_")) {
        if(element != '0') { starter_query += `${element}_`; main_non_zero_count++; }
        else { main_zero_count++; }
    };

    if(main_zero_count === 0) {
        update_cards_sector(button);
        return;
    }

    // Reinicia as opções
    let buttons = document.querySelectorAll("#technical_manuals_group button");
    for(button of buttons) {
        let non_zero_count = 0;
        for(element of button.id.split("_")) {
            if(element != '0') { non_zero_count++; }
        };

        if(non_zero_count === 1) {
            button.hidden = false;
        } else {
            button.hidden = true;}
    }

    buttons = document.querySelectorAll(`[id^="${starter_query}"]`);
    for(button of buttons) {
        let non_zero_count = 0;
        for(element of button.id.split("_")) {
            if(element != '0') { non_zero_count++; }
        };

        if(non_zero_count <= main_non_zero_count + 1) {
            button.hidden = false;
        }
        
    }
}

async function update_cards_sector(button) {
    document.getElementById("card-text").innerHTML = button.id;
}