document.addEventListener("click", mouse => {
    if(element_hover(document.querySelector("#options_section"), mouse)) {
        console.log("Mouse sobre as opções");
    }

    const context_menu = document.querySelector(".rigth-click-menu");
    const rect = context_menu.getBoundingClientRect();

    if(mouse.pageX < rect.left || mouse.pageX > rect.right || mouse.pageY < rect.top || mouse.pageY > rect.bottom) {
        context_menu.classList.remove("active");
    }
});

document.addEventListener("contextmenu", mouse => {
    const context_menu = document.querySelector(".rigth-click-menu");
    const share_menu = document.querySelector(".share-menu");

    context_menu.classList.remove("active");
    share_menu.classList.remove("active");

    let options_section = document.getElementById("options_section");
    if(element_hover(options_section, mouse)) {
        mouse.preventDefault();
    
        let x = mouse.pageX,
        y = mouse.pageY,
        winWidth = window.innerWidth,
        winHeight = window.innerHeight,
        cmWidth = context_menu.offsetWidth,
        cmHeight = context_menu.offsetHeight;

        if(x > (winWidth - cmWidth- share_menu.offsetWidth)) {
            share_menu.style.left = "-200px";
        } else {
            share_menu.style.left = "";
            share_menu.style.innerHeight = "-200px";
        }

        x = x > winWidth - cmWidth ? winWidth - cmWidth : x;
        y = y > winHeight - cmHeight ? winHeight - cmHeight : y;

        context_menu.style.left = `${x}px`;
        context_menu.style.top = `${y}px`;
        context_menu.classList.add("active");
    }
});

function element_hover(element, mouse) {
    const rect = element.getBoundingClientRect();
    let x = mouse.pageX;
    let y = mouse.pageY;

    if(x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return true;
    } else {
        return false;
    }
}

document.querySelector(".item.share").addEventListener("mouseenter", function() {
    document.querySelector(".share-menu").classList.add("active");
});

document.querySelector(".item.share").addEventListener("mouseleave", function(mouse) {
    const share = document.querySelector(".item.share");
    const rect = share.getBoundingClientRect();

    if(mouse.clientX <= rect.left || mouse.clientY <= rect.top || mouse.clientY >= rect.bottom) {
        document.querySelector(".share-menu").classList.remove("active");
    }
});

document.querySelector(".share-menu").addEventListener("mouseleave", function() {
    document.querySelector(".share-menu").classList.remove("active");
});