// Variable that store the list of projects
let allProjects = [];

// Event listener for the "View Projects" button, request projects from server and covert to JSON then save to all projects array
// render the table with the all project array, show the export button and search container
document.getElementById('viewProjects').addEventListener('click', () => {
  fetch('http://localhost:3000/projects')
  .then(res => res.json())
  .then(data => {
    allProjects = data;
    renderTable(allProjects);
    document.getElementById('projectsTable').style.display = 'table';
    document.getElementById('searchContainer').style.display = 'block';
  })
  // catch any errors
  .catch(err => console.error('Error fetching projects:', err));
});
// filter table results as user is typing in the search bar, changing data to lowercase so as to match incase of uppercase characters
// then render table with filtered results
document.getElementById('searchInput').addEventListener('input', function () {
  const query = this.value.toLowerCase();
  const filtered = allProjects.filter(p =>
    p.title.toLowerCase().includes(query) ||
    formatDate(p.start_date).includes(query) ||
    formatDate(p.end_date).includes(query) ||
    (p.short_description && p.short_description.toLowerCase().includes(query)) ||
    (p.phase && p.phase.toLowerCase().includes(query))
  );
  renderTable(filtered);
});
// export button functionality to allow download of CSV file
document.getElementById('export').addEventListener('click', () => {
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
  const blob = new Blob([csvRows.map(e => e.join(',')).join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'projects.csv';
  a.click();
  URL.revokeObjectURL(url);
});
// format date for start and end project dates so they are in a readable format
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
// render table function to return table with populated data coping with null attributes by adding some text in place
function renderTable(data) {
  const tbody = document.querySelector('#projectsTable tbody');
  const thead = document.querySelector('#projectsTable thead');
  tbody.innerHTML = '';
  thead.innerHTML = '';

  const headers = [
    { label: 'Project title', key: 'title' },
    { label: 'Project start date', key: 'start_date' },
    { label: 'Project end date', key: 'end_date' },
    { label: 'Description', key: 'short_description' },
    { label: 'Current phase', key: 'phase' },
    { label: 'Contact email', key: 'assigned_user_email' }
  ];

  const trHeader = document.createElement('tr');
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header.label;
    trHeader.appendChild(th);
  });
  thead.appendChild(trHeader);

  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.title}</td>
      <td>${formatDate(row.start_date)}</td>
      <td>${formatDate(row.end_date)}</td>
      <td>${row.short_description || 'No description'}</td>
      <td>${row.phase}</td>
      <td>${row.assigned_user_email || 'No user assigned currently'}</td>
    `;
    tbody.appendChild(tr);
  });
}

  