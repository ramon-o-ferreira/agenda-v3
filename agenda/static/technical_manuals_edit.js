document.addEventListener("click", left_click => {
    console.log(left_click.pageX, left_click.pageY);

    const context_menu = document.querySelector(".rigth-click-menu");
    const rect = context_menu.getBoundingClientRect();

    console.log(rect.left, rect.top, rect.right, rect.bottom)
    if(left_click.pageX < rect.left || left_click.pageX > rect.right || left_click.pageY < rect.top || left_click.pageY > rect.bottom) {
        context_menu.classList.remove("active")
    }
});

document.addEventListener("contextmenu", rigth_click => {
    const context_menu = document.querySelector(".rigth-click-menu");
    const share_menu = document.querySelector(".share-menu");

    context_menu.classList.remove("active");
    share_menu.classList.remove("active");

    let options_section = document.getElementById("options_section");
    const rect = options_section.getBoundingClientRect();
    
    if(rigth_click.pageX >= rect.left && rigth_click.pageX <= rect.right && rigth_click.pageY >= rect.top && rigth_click.pageY <= rect.bottom) {
        rigth_click.preventDefault();
    
        let x = rigth_click.pageX,
        y = rigth_click.pageY,
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

document.querySelector(".item.share").addEventListener("mouseenter", function() {
    document.querySelector(".share-menu").classList.add("active");
});

document.querySelector(".item.share").addEventListener("mouseleave", function(mouse) {
    const share = document.querySelector(".item.share");
    const rect = share.getBoundingClientRect();

    if(mouse.clientX < rect.left || mouse.clientY < rect.top || mouse.clientY > rect.bottom) {
        document.querySelector(".share-menu").classList.remove("active");
    }
});

document.querySelector(".share-menu").addEventListener("mouseleave", function() {
    document.querySelector(".share-menu").classList.remove("active");
});