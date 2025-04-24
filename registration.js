let form = document.getElementById("form");
let email = form.email;
let confirmEmail = form["confirm-email"];
email.onchange = checkEmail;
confirmEmail.oninput = checkEmail;
// function to compare email and confirm email fields
function checkEmail() {
    let error = '';
    if (email.value != confirmEmail.value) {
        error = "Email addresses don't match";
    }
    email.setCustomValidity(error);
    confirmEmail.setCustomValidity(error);
    email.reportValidity();
    confirmEmail.reportValidity();
}
// form submission function preventing defualt form submission and sending the form to the server
// if successful display success message otherwise display error message
document.getElementById("form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const email = document.getElementById("email").value;

    const response = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email })
    });

    const result = await response.json();

    if (response.ok) {
    alert(result.message);
    window.location.href = '/login.html'; 
    } else {
    alert(result.message);
    }
});
