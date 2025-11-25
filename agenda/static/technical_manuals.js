async function update_options(button) {
    if(button.classList.contains("active")) {
        button.classList.remove("active");
    } else {
        for(element of document.querySelectorAll("#technical_manuals_group .active")) { element.classList.remove("active"); }
        button.classList.add("active");
    }

    let main_id = button.id;
    let main_level = main_id.split("_").length;

    // if(main_zero_count === 0) {
    //     update_cards_sector(button);
    //     return;
    // }

    // Reinicia as opções
    let buttons = document.querySelectorAll("#technical_manuals_group button");
    for(button of buttons) {
        if(button.id.split("_").length === 1) {
            button.hidden = false;
        } else {
            button.hidden = true;
        }
    }

    let query = "";
    for(let i = 0; i < main_id.split("_").length; i++) {
        query += `${main_id.split("_")[i]}_`

        buttons = document.querySelectorAll(`[id^="${query}"]`);
        for(button of buttons) {
            let level = button.id.split("_").length;
            if(level === i + 2) {
                button.hidden = false;
            }
        }
    }
}

async function update_cards_sector(button) {
    document.getElementById("card-text").innerHTML = button.id;
}