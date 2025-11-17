const $ = document;
const contextMenu = $.querySelector(".wrapper");
const shareMenu = $.querySelector(".share-menu");

$.addEventListener("contextmenu", e => {
    e.preventDefault();
    
    let x = e.pageX,
    y = e.pageY,
    winWidth = window.innerWidth,
    winHeight = window.innerHeight,
    cmWidth = contextMenu.offsetWidth,
    cmHeight = contextMenu.offsetHeight;

    console.log(x, y, winWidth, winHeight, cmWidth, cmHeight)

    if(x > (winWidth - cmWidth- shareMenu.offsetWidth)) {
        shareMenu.style.left = "-200px";
    } else {
        shareMenu.style.left = "";
        shareMenu.style.innerHeight = "-200px";
    }

    x = x > winWidth - cmWidth ? winWidth - cmWidth : x;
    y = y > winHeight - cmHeight ? winHeight - cmHeight : y;

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.classList.add("active");
});

$.addEventListener("click", () => contextMenu.classList.remove("active"));