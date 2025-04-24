// Variable that store the current user details and a list of projects
let currentUserId = null;
let allProjects = [];

// Event listener that waits for the HTML document to load before running the code
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Session check to see if user is logged in
    const sessionRes = await fetch('/api/session');
    if (!sessionRes.ok) {
      // Check if the session is not valid or the user is logged out
      throw new Error('Not logged in');
    }

    // Fetch session data to check if user is logged in
    const sessionData = await sessionRes.json();
    // Store logged in users UID from users SQL table
    currentUserId = sessionData.uid;
    // Return the users username to be displayed on the page
    document.getElementById('username-display').textContent = sessionData.username;

    // call load projects function and wait for it to complete before moving on
    await loadProjects();

    // Add event listener to the search input field to filter projects as the user types
    document.getElementById('searchInput').addEventListener('input', function () {
        // if user is not logged in exit function
        if (!currentUserId) return;  
        // get the query the user has typed in and convert it to lowercase
        const query = this.value.toLowerCase();
        // filter the all projects array based on the search input
        const filtered = allProjects.filter(p =>
            //checks query against the fiels
            p.title.toLowerCase().includes(query) ||
            formatDate(p.start_date).includes(query) ||
            formatDate(p.end_date).includes(query) ||
            (p.short_description && p.short_description.toLowerCase().includes(query)) ||
            (p.phase && p.phase.toLowerCase().includes(query)) //converting these two fields to lowercase to match query
        );
        // call the render table function with the filtered data
        renderTable(filtered);
      });

  } catch (err) {
    console.error('Error during page load:', err);
    
    // Redirect to the home page if there's a session error like the user is not logged in
    if (err.message === 'Not logged in') {
      window.location.href = '/login.html';
    }
  }
});

async function loadProjects() {
  try {
    // fetch all projects
    const projectsRes = await fetch('/api/all-projects');
    // check if the rquest was successful and if not throw an error
    if (!projectsRes.ok) throw new Error('Failed to load projects');
    //resolve the response data as JSON
    const projects = await projectsRes.json();
    // save the returned data in the global all projects array
    allProjects = projects;
    // call the render table with all projects as the parameter
    renderTable(allProjects);
  } catch (error) {
    // return error if anything occured during the fetch operation
    console.error('Error loading projects:', error);
  }
}
// Format date so that it is returned in a readable format - dd/mm/yyyy
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}
// resets (escapes) HTML special characters in the input text to prevent XSS attacks
// This ensures any HTML code is treated as plain text instead of being rendered as HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// create project function that creates a new row and adds the fields to be added by the user for project creation
function createProject(project) {
    const row = document.createElement('tr');
    row.setAttribute('data-pid', project.pid);
    row.setAttribute('data-uid', project.uid);
    // create HTML table data removing any special characters using the escapeHtml function and
    // formatting dates using the format date function  
    // Also allows editing if the project owner is the current user
    // The project will auto assign to the current UID once it's created
    row.innerHTML = `
        <td class="title">${escapeHtml(project.title)}</td>
        <td class="start_date" data-raw="${project.start_date}">${formatDate(project.start_date)}</td>
        <td class="end_date" data-raw="${project.end_date}">${formatDate(project.end_date)}</td>
        <td class="short_description">${escapeHtml(project.short_description || '')}</td>
        <td class="phase">${escapeHtml(project.phase)}</td>
        <td>
        ${project.uid === currentUserId
            ? `<button onclick="enableEdit(${project.pid})">Update</button>`
            : `<span style="color:gray;">Not editable</span>`}
        </td>
    `;
    return row;
}
// format date function specifically for the date fields once edited so the date is updated and not displaying the original date
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
// Enables editing for specific project based on checks done previously against user (UID)
// Then adds buttons to allow update and input fields once the user clicks update introducing a save and cancel button
// a dropdown for phase and date pickers for the start and end date which are pre-populated with the current saved dates
function enableEdit(pid) {
    const row = document.querySelector(`tr[data-pid="${pid}"]`);
    if (!row) {
        console.error('Row not found for pid:', pid);
        return;
    }
  
    const titleCell = row.querySelector('.title');
    const startDateCell = row.querySelector('.start_date');
    const endDateCell = row.querySelector('.end_date');
    const descriptionCell = row.querySelector('.short_description');
    const phaseCell = row.querySelector('.phase');
    
    titleCell.innerHTML = `<input type="text" value="${escapeHtml(titleCell.textContent.trim())}">`;
    startDateCell.innerHTML = `<input type="date" value="${formatDateForInput(startDateCell.dataset.raw)}">`;
    endDateCell.innerHTML = `<input type="date" value="${formatDateForInput(endDateCell.dataset.raw)}">`;
    descriptionCell.innerHTML = `<input type="text" value="${escapeHtml(descriptionCell.textContent.trim())}">`;
    const currentPhase = phaseCell.textContent.trim();

    phaseCell.innerHTML = `
    <select>
        <option value="Design" ${currentPhase === "Design" ? "selected" : ""}>Design</option>
        <option value="Development" ${currentPhase === "Development" ? "selected" : ""}>Development</option>
        <option value="Testing" ${currentPhase === "Testing" ? "selected" : ""}>Testing</option>
        <option value="Deployment" ${currentPhase === "Deployment" ? "selected" : ""}>Deployment</option>
        <option value="Complete" ${currentPhase === "Complete" ? "selected" : ""}>Complete</option>
    </select>
    `;
    
    const actionsCell = row.querySelector('td:last-child');
    actionsCell.innerHTML = `
        <button onclick="saveEdit(${pid})">Save</button>
        <button onclick="cancelEdit(${pid})">Cancel</button>
        `;
}
// Saves the updated project data to the server and updates the table rows with new values
// Replaces input fields with text and restores the edit button on success
function saveEdit(pid) {
    const row = document.querySelector(`tr[data-pid="${pid}"]`);
    if (!row) return;

    const title = row.querySelector('.title input').value.trim();
    const startDateInput = row.querySelector('.start_date input');
    const endDateInput = row.querySelector('.end_date input');
    const description = row.querySelector('.short_description input').value.trim();
    const phase = row.querySelector('.phase select').value.trim();

    const originalStartDate = row.querySelector('.start_date').dataset.raw;
    const originalEndDate = row.querySelector('.end_date').dataset.raw;

    const startDate = startDateInput.value || originalStartDate;
    const endDate = endDateInput.value || originalEndDate;

    const updatedProject = {
    pid,
    title,
    start_date: startDate,
    end_date: endDate,
    short_description: description,
    phase
    };

    // Send to server
    fetch(`/projects/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to save project');
      return res.json();
    })
    .then(data => {
        const projectIndex = allProjects.findIndex(p => p.pid === pid);
        if (projectIndex !== -1) {
            allProjects[projectIndex].phase = phase;
        }
        // Update DOM on success
        row.querySelector('.title').textContent = title;
        row.querySelector('.start_date').innerHTML = formatDate(startDate);
        row.querySelector('.start_date').dataset.raw = startDate;
        row.querySelector('.end_date').innerHTML = formatDate(endDate);
        row.querySelector('.end_date').dataset.raw = endDate;
        row.querySelector('.short_description').textContent = description;
        row.querySelector('.phase').textContent = phase;

        row.querySelector('td:last-child').innerHTML = `<button onclick="enableEdit(${pid})">Edit</button>`;
    })
    .catch(err => {
        console.error('Error saving project:', err);
        alert('Something went wrong while saving.');
    });
}
// cancels edit of project and reverts to original state
function cancelEdit(pid) {
    const row = document.querySelector(`tr[data-pid="${pid}"]`);
    if (!row) return;

    const project = allProjects.find(p => p.pid === pid);
    if (!project) return;

    const newRow = createProject(project);
    row.replaceWith(newRow);
}
// renders the table with the information returned from the SQL database
function renderTable(projects) {
    const tableBody = document.querySelector('#projectTable tbody');
    tableBody.innerHTML = '';
    projects.forEach(project => tableBody.appendChild(createProject(project)));
}
// Event listener for the export button which triggers the download of a CSV file with the project data
document.getElementById('export')?.addEventListener('click', () => {
  const csvRows = [
    ['Project title', 'Start date', 'End date', 'Description', 'Phase', 'Email'],
    ...allProjects.map(p => [
      `"${p.title}"`,
      `"${formatDate(p.start_date)}"`,
      `"${formatDate(p.end_date)}"`,
      `"${p.short_description || 'No description'}"`,
      `"${p.phase}"`,
      `"${p.assigned_user_email || 'No user assigned currently'}"`
    ])
  ];
  const blob = new Blob([csvRows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'projects.csv';
  a.click();
  URL.revokeObjectURL(url);
});
// variables to add an add project button and new row for entering the project
const addProjectButton = document.getElementById('add-project');
const newProjectRow = document.getElementById('new-project');
// show the new project row when the add project button is clicked and both elements exist
if (addProjectButton && newProjectRow) {
  addProjectButton.addEventListener('click', () => {
    newProjectRow.style.display = 'table-row';
  });
} else {
  console.error('Required elements not found: #add-project or #new-project');
}
// checks if there is a cancel button for new projects and adds an event listener
// then changes the styling of the new project form to hidden if clicked
const cancelNewProjectButton = document.getElementById('cancel-new-project');
if (cancelNewProjectButton) {
  cancelNewProjectButton.addEventListener('click', () => {
    const newProjectForm = document.getElementById('new-project');
    if (newProjectForm) {
      newProjectForm.style.display = 'none';
    }
  });
} else {
  console.error('The cancel-new-project button was not found');
}
// Handles the save button for new project - adds event listener, creates a new project, sends it to the server, and updates the project list
document.getElementById('save-new-project')?.addEventListener('click', async () => {
  const title = document.getElementById('new-title')?.value;
  const start_date = document.getElementById('new-start-date')?.value;
  const end_date = document.getElementById('new-end-date')?.value;
  const short_description = document.getElementById('new-desc')?.value;
  const phase = document.getElementById('new-phase')?.value;

  const newProject = { title, start_date, end_date, short_description, phase, uid: currentUserId };

  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject),
    });
  
    if (res.ok) {
      await loadProjects();
      
      const newProjectForm = document.getElementById('new-project');
      if (newProjectForm) {
        newProjectForm.style.display = 'none';
      }
    } else {
      console.error('Failed to create project');
    }
  } catch (err) {
    console.error('Error creating project:', err);
  }
  
});
// trigger logout process when logout button clicked
document.getElementById('logout').addEventListener('click', () => {
    fetch('/login/logout', { method: 'POST' })
      .then(() => window.location.href = '/');
  });

  