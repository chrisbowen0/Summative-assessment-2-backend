// Import required dependencies
const db = require('./db');
const config = require('../config');

// Get multiple projects from database
async function getMultiple() {
    const rows = await db.query(
        `SELECT p.title, p.start_date, p.end_date, p.short_description, p.phase, 
                IFNULL(u.email, 'No user assigned currently') AS assigned_user_email
         FROM projects p
         LEFT JOIN users u ON p.uid = u.uid`
    );
    if (!rows) {
        return [];
    }
    return rows;
}
// function to create new projects
async function create(projects) {
    const{title, start_date, end_date, short_description, phase, uid}=projects;
    const nullUID = (uid === undefined || uid === '') ? null : uid;
    const nullDescription = (short_description === undefined || short_description === '') ? null : short_description;

    const result = await db.query(
        `INSERT INTO projects(title, start_date, end_date, short_description, phase, uid) VALUES(?,?,?,?,?,?)`,
        [title, start_date, end_date, nullDescription, phase, nullUID]);
        let message = 'Error in creating project';
        if (result.affectedRows) {
            message = 'Project created successfully';
        }
        return {message};
}
// Function to update an existing project
async function update(id, projects) {
    const fields = [];
    const values = [];

    // Only update if a field is present

    if ('title' in projects && projects.title !== '' && projects.title !== null) {
        fields.push('title = ?');
        values.push(projects.title);
    }
    if ('start_date' in projects && projects.start_date !== '' && projects.start_date !== null) {
        fields.push('start_date = ?');
        values.push(projects.start_date);
    }
    if ('end_date' in projects && projects.end_date !== '' && projects.end_date !== null) {
        fields.push('end_date = ?');
        values.push(projects.end_date);
    }
    if ('short_description' in projects) {
        fields.push('short_description = ?');
        values.push(projects.short_description !== '' ? projects.short_description : null);
    }
    if ('phase' in projects && projects.phase !== '' && projects.phase !== null) {
        fields.push('phase = ?');
        values.push(projects.phase);
    }
    if ('uid' in projects) {
        fields.push('uid = ?');
        values.push(projects.uid !== '' ? projects.uid : null);
    }

    if (fields.length === 0) {
        return {message: 'No fields provided to update'};
    }

    values.push(id);

    const sql = `UPDATE projects SET ${fields.join(', ')} WHERE pid=?`;

    const result = await db.query(sql, values);
        let message = 'Error in updating project';
        if (result.affectedRows) {
            message = 'Project updated successfully';
        }
        return {message};
}

// function to delete a project - this isn't used
async function remove(id) {
    const result = await db.query(
        `DELETE FROM projects WHERE pid=${id}`
    );
    let message = 'Error in deleting project';
    if (result.affectedRows) {
        message = 'Project deleted successfully';
    }
    return {message};
}
// function to get one project by it's ID
async function getOne(id) {
    const rows = await db.query(
        `SELECT p.title, p.start_date, p.end_date, p.short_description, p.phase,
                IFNULL(u.email, 'No user assigned currently') AS assigned_user_email
         FROM projects p
         LEFT JOIN users u ON p.uid = u.uid
         WHERE p.pid = ?`, [id]
    );
    if (!rows) {
        return [];
    }
    return rows;
}
// export the functions to be used in other parts of the project
module.exports = {
    getMultiple,
    create,
    update,
    remove,
    getOne
}

