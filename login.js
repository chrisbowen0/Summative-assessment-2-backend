// Add event listener to submit button and prevent defualt form submission
document.getElementById('login').addEventListener('submit', async function (e) {
    e.preventDefault();
    // get data inputted in form fields
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    // send form data to server
    const response = await fetch('http://localhost:3000/login/', {  
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
  
    const result = await response.json();
    // if server responds with  a successful message reroute user to profile page, otherwise return error message
    if (response.ok) {
        window.location.href = result.redirect;
    } else {
        alert(result.message);
    }
  });
  
  
  
  