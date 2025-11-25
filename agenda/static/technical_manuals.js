async function update_options(button) {
    let main_id = button.id;
    let main_level = main_id.split("_").length;
    let is_active = false;
    let is_item = false;

    if(button.classList.contains("is-item")) {
        is_item = true;
    }

    for(element of document.querySelectorAll("#technical_manuals_group .active")) { element.classList.remove("active"); }
    button.classList.add("active");

    let buttons = document.querySelectorAll(`[id^="${main_id}"]`);

    let hidden_counter = 0;
    for(button of buttons) {
        if(button.hidden === true) { hidden_counter++; }
    }

    if(hidden_counter < buttons.length - 1) {
        is_active = true;
    }

    if(buttons.length > 1) {
        for(button of buttons) {
            level = button.id.split("_").length;

            if(is_active && level > main_level) {
                button.hidden = true;
            } else {
                if(level === main_level + 1) {
                    button.hidden = false;
                }
            }
        }
    }

    if(is_item) { update_cards_sector(button); }
}

async function update_cards_sector(button) {
    document.getElementById("card-text").innerHTML = button.id;
}