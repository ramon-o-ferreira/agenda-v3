async function update_options(option) {
    for(element of document.querySelectorAll(".active")) { element.classList.remove("active"); }

    let id = option.id;
    let button = document.getElementById(id);

    if(button.classList.contains("active")) {
        button.classList.remove("active");
    } else {
        button.classList.add("active");
    }
}