function update_technicians_form() {
    const username = document.getElementById("username");
    const username_group = document.getElementById("username-group")
    const telephone = document.getElementById("telephone");
    const password = document.getElementById("password");
    const password_group = document.getElementById("password-group");
    const confirm_password = document.getElementById("confirm_password");
    const confirm_password_group = document.getElementById("confirm-password-group");

    const technician_id = document.getElementById("technicians").value;
    if(technician_id != 0) {
        username_group.style.display = 'none';
        password_group.style.display = 'none';
        confirm_password_group.style.display = 'none';

        fetch(`http://localhost:5000/get_technician?id=${technician_id}`)
        .then(response => response.json())
        .then(technician => {
            if(technician) {
                telephone.value = technician.telephone;
                username.value = technician.username + "_update";
                password.value = "123456";
                confirm_password.value = "123456";
            }
        });
    }
    else {
        username.value = "";
        telephone.value = "";
        password.value = "";
        confirm_password.value = "";

        username_group.style.display = 'block';
        password_group.style.display = 'block';
        confirm_password_group.style.display = 'block';
    }
}

document.getElementById("technicians").addEventListener("change", update_technicians_form);
