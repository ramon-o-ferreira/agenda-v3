async function update_options(option) {
    let id = option.id;
    let button = document.getElementById(id);

    if(button.classList.contains("active")) {
        button.classList.remove("active");
    } else {
        for(element of document.querySelectorAll("#technical_manuals_group .active")) { element.classList.remove("active"); }
        button.classList.add("active");
    }
}