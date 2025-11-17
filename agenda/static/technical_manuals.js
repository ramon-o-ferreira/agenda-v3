async function update_options(option) {
    let id = option.id;
    let button = document.getElementById(id);

    if(button.classList.contains("active")) {
        button.classList.remove("active");
        console.log("Contains")
    } else {
        for(element of document.querySelectorAll(".active")) { element.classList.remove("active"); }
        button.classList.add("active");
        console.log("Npe")
    }
}

// const $ = document;
// const contextMenu = $.querySelector(".wrapper");
// const shareMenu = $.querySelector(".share-menu");

// $.addEventListener("contextmenu", e => {
//     e.preventDefault();
    
//     let x = e.offsetX,
//     y = e.offsetY,
//     winWidth = window.innerWidth,
//     winHeight = window.innerHeight,
//     cmWidth = contextMenu.offsetWidth,
//     cmHeight = contextMenu.offsetWidth;

//     if(x > (winWidth - cmWidth- shareMenu.offsetWidth)) {
//         shareMenu.style.left = "-200px";
//     } else {
//         shareMenu.style.left = "";
//         shareMenu.style.innerHeight = "-200px";
//     }

//     x = x > winWidth - cmWidth ? winWidth - cmWidth : x;
//     y = y > winHeight - cmHeight ? winHeight - cmHeight : y;

//     contextMenu.style.left = `${x}px`;
//     contextMenu.style.top = `${y}px`;
//     contextMenu.classList.add("active");
// });

// $.addEventListener("click", () => contextMenu.classList.remove("active"));