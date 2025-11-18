async function open_options_context_menu(mouse) {
    const context_menu = document.querySelector(".rigth-click-menu");
    const share_menu = document.querySelector(".share-menu");
    
    if(context_menu) {context_menu.classList.remove("active"); }
    if(share_menu) { share_menu.classList.remove("active"); }

    let options_section = document.getElementById("options_section");
    if(element_hover(options_section, mouse)) {
        mouse.preventDefault();
    
        let x = mouse.pageX,
        y = mouse.pageY,
        window_width = window.innerWidth,
        window_height = window.innerHeight,
        share_menu_width = context_menu.offsetWidth,
        share_menu_height = context_menu.offsetHeight;

        if(share_menu) {
            if(x > (window_width - share_menu_width - share_menu.offsetWidth)) {
                share_menu.style.left = "-200px";
            } else {
                share_menu.style.left = "";
                share_menu.style.innerHeight = "-200px";
            }

            if(y > (window_height - share_menu_height - (share_menu.offsetHeight / 2))) {
                share_menu.style.top = "-170px";
            } else {
                share_menu.style.top = "-12px";
            }
        }

        x = x > window_width - share_menu_width ? window_width - share_menu_width : x;
        y = y > window_height - share_menu_height ? window_height - share_menu_height : y;

        context_menu.style.left = `${x}px`;
        context_menu.style.top = `${y}px`;
        context_menu.classList.add("active");
    }
}

async function close_options_context_menu(mouse) {
    const context_menu = document.querySelector(".rigth-click-menu");
    const rect = context_menu.getBoundingClientRect();

    if(mouse.pageX < rect.left || mouse.pageX > rect.right || mouse.pageY < rect.top || mouse.pageY > rect.bottom) {
        context_menu.classList.remove("active");
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

document.addEventListener("click", mouse => {
    close_options_context_menu(mouse);
});

document.addEventListener("contextmenu", mouse => {
    open_options_context_menu(mouse);
});

document.querySelector(".item.share").addEventListener("mouseenter", () => {
    document.querySelector(".share-menu").classList.add("active");
});

document.querySelector(".item.share").addEventListener("mouseleave", mouse => {
    const share = document.querySelector(".item.share");
    const rect = share.getBoundingClientRect();

    if(mouse.clientX <= rect.left || mouse.clientY <= rect.top || mouse.clientY >= rect.bottom) {
        document.querySelector(".share-menu").classList.remove("active");
    }
});

document.querySelector(".share-menu").addEventListener("mouseleave", () => {
    document.querySelector(".share-menu").classList.remove("active");
});