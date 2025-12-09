async function context_menu_action(item) {
    console.log(last_right_clicked_option ? last_right_clicked_option.innerText : "None");
    switch(item.innerText) {
        case "Adicionar":
            console.log(item.innerText);
            break;
        case "Item":
            console.log(item.innerText);
            break;
        case "Grupo":
            console.log(item.innerText);
            break;
        case "Subitem":
            console.log(item.innerText);
            break;
        case "Subgrupo":
            console.log(item.innerText);
            break;
        case "Renomear":
            console.log(item.innerText);
            break;
        case "Organizar":
            console.log(item.innerText);
            break;
        case "Deletar":
            console.log(item.innerText);
            break;
        case "Configuração":
            console.log(item.innerText);
            break;
        default:
            console.log(item.innerText);
            break;
    }
}

function edit_context_menu(mouse, section) {
    if(section == "options") { 
        last_right_clicked_option = null;
        for(button of document.querySelectorAll("#options_group button")) {
            if(element_hover(button, mouse)) {
                last_right_clicked_option = button;
                break;
            }
        }

        let is_root = false;
        let is_group = false;
        let is_item = false;
        if(last_right_clicked_option) {
            if(last_right_clicked_option.classList.contains("is-item")) { is_item = true; }
            else { is_group = true; }
        } else {
            is_root = true;
        }

        let items = document.querySelectorAll(".item");
        for(item of items) {
            switch(item.innerText) {
                case "Adicionar":
                    if(is_root || is_group) { item.hidden = false; }
                    else { item.hidden = true; }
                    break;
                case "Item":
                    if(is_root || is_group) { item.hidden = false; }
                    else { item.hidden = true; }
                    break;
                case "Grupo":
                    if(is_root || is_group) { item.hidden = false; }
                    else { item.hidden = true; }
                    break;
                case "Subitem":
                    if(is_group) { item.hidden = false; }
                    else { item.hidden = true; }
                    break;
                case "Subgrupo":
                    if(is_group) { item.hidden = false; }
                    else { item.hidden = true; }
                    break;
                case "Renomear":
                    if(is_group || is_item) { item.hidden = false; }
                    else { item.hidden = true; }
                    break;
                case "Organizar":
                    if(is_group || is_item) { item.hidden = false; }
                    else { item.hidden = true; }
                    break;
                case "Deletar":
                    if(is_group || is_item) { item.hidden = false; }
                    else { item.hidden = true; }
                    break;
                case "Configuração":
                    if(is_root || is_group || is_item) { item.hidden = false; }
                    else { item.hidden = true; }
                    break;
                case "Ativado":
                    if(is_root || is_group || is_item) { item.hidden = false; }
                    else { item.hidden = true; }
                    break;
                case "Visibilidade":
                    if(is_root || is_group || is_item) { item.hidden = false; }
                    else { item.hidden = true; }
                    break;
                default:
                    item.hidden = true;
                    break;
            }
        }
    } else {
        console.log("Cards selecionado");
    }
}

async function open_context_menu(mouse, button) {
    const context_menu = document.querySelector(".context-menu");
    for(add_menu of document.querySelectorAll(".expand-menu")) {
        if(context_menu) { context_menu.classList.remove("active"); }
        if(add_menu) { add_menu.classList.remove("active"); }

        let options_section = document.getElementById("options_section");
        if(element_hover(options_section, mouse)) {
            mouse.preventDefault();

            let x = mouse.pageX,
            y = mouse.pageY,
            window_width = window.innerWidth,
            window_height = window.innerHeight,
            context_menu_width = context_menu.offsetWidth,
            context_menu_height = context_menu.offsetHeight,
            add_menu_width = add_menu.offsetWidth,
            add_menu_height = add_menu.offsetHeight;

            if(add_menu) {
                if(x > (window_width - context_menu_width - add_menu_width)) {
                    add_menu.style.left = "-200px";
                } else {
                    add_menu.style.left = "";
                    add_menu.style.innerHeight = "-200px";
                }

                if(add_menu_height > context_menu_height && y > (window_height - add_menu_height)) {
                    //add_menu.style.top = "-222px";
                    add_menu.style.top = `-${Math.round(add_menu_height) - 12}px`
                } else {
                    add_menu.style.top = "-65px";
                }
            }

            x = x > window_width - context_menu_width ? window_width - context_menu_width : x;
            y = y > window_height - context_menu_height ? window_height - context_menu_height : y;

            context_menu.style.left = `${x}px`;
            context_menu.style.top = `${y}px`;
            context_menu.classList.add("active");
        }
    }
}

async function close_context_menu(mouse) {
    let is_over_context_menu = element_hover(document.querySelector(".context-menu"), mouse);
    let is_over_share_menu = element_hover(document.querySelector(".expand-menu"), mouse);

    if(is_over_context_menu || is_over_share_menu) {
        let items = document.querySelectorAll("#context_menu .item");
        for(item of items) {
            if(element_hover(item, mouse)) {
                if(item.classList.contains("expand")) { continue; }
                else { document.querySelector(".context-menu").classList.remove("active"); }
                break;
            }
        }
    } else {
        document.querySelector(".context-menu").classList.remove("active");
    }
}

function element_hover(element, mouse) {
    if(element && mouse) {
        const rect = element.getBoundingClientRect();
        let x = mouse.pageX;
        let y = mouse.pageY;

        if(x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

for(let element of document.querySelectorAll(".item.expand")) {
    element.addEventListener("mouseenter", () => {
        element.nextElementSibling.querySelector(".expand-menu").classList.add("active");
    });
};

for(let element of document.querySelectorAll(".expand-menu")) {
    element.addEventListener("mouseleave", () => {
        element.classList.remove("active");
    });
}

for(let element of document.querySelectorAll(".item.expand")) {
    element.addEventListener("mouseleave", mouse => {
        let context_menu_rect = element.getBoundingClientRect();
        if(mouse.clientX <= context_menu_rect.left || mouse.clientY <= context_menu_rect.top || mouse.clientY >= context_menu_rect.bottom) {
            element.nextElementSibling.querySelector(".expand-menu").classList.remove("active");
        }
    });
}

document.addEventListener("click", mouse => {
    close_context_menu(mouse);
});

document.addEventListener("contextmenu", mouse => {
    let section;
    if(element_hover(document.getElementById("options_section"), mouse)) {
        mouse.preventDefault();
        section = "options";
    }

    if(element_hover(document.getElementById("cards_section"), mouse)) {
        mouse.preventDefault();
        section = "cards";
    }

    edit_context_menu(mouse, section);
    open_context_menu(mouse);
});

document.querySelector(".card-body.p-0.m-1.overflow-auto").addEventListener("scroll", mouse => {
    close_context_menu(mouse);
});

document.querySelectorAll(".item").forEach(item => {
    item.addEventListener('click', () => {
        context_menu_action(item);
    });
});

document.addEventListener("mousemove", (mouse) => {
    for(let context_menu of document.querySelectorAll(".item.expand")) {
        let expand_menu = context_menu.nextElementSibling.querySelector(".expand-menu");
        
        if(expand_menu.classList.contains("active") && !element_hover(expand_menu, mouse)) {
            let context_menu_rect = context_menu.getBoundingClientRect();
            if(mouse.clientY < context_menu_rect.top || mouse.clientY > context_menu_rect.bottom) {
                expand_menu.classList.remove("active");
            }
        }
    }
});