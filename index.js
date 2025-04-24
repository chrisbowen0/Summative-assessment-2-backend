// import dependencies
const express = require("express");
const path = require("path");
const app = express();
const port = 3000;
const projectsRouter = require('./routes/projects');
const loginRoute = require('./routes/auth');
const registerRoute = require('./routes/register');
const cors = require('cors');
const session = require('express-session');
const db = require('./services/db');

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Session management configuration
app.use(session({
    secret: 'session-key', //can set this to something more encoded but this is fine for local testing
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS (false for local testing)
}));
// Prevent caching of responses
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});
//Serve static files from root directory
app.use(express.static(path.join(__dirname)));

// Routes
app.use("/login", loginRoute);
app.use("/projects", projectsRouter);
app.use('/register', registerRoute);
// Serve home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "home.html"));
});
// API endpoint to check session status
app.get('/api/session', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not logged in' });
    }
    res.json({ username: req.session.user.username, uid: req.session.user.id });
});
// Serve the profile page if logged in else reroute to home page
app.get('/profile.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'profile', 'profile.html'));
});
// API endpoint to update project details
app.put('/api/projects/:pid', async (req, res) => { 
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    const { pid } = req.params;
    const { title, start_date, end_date, short_description, phase } = req.body;

    try {
        const project = await db.query('SELECT * FROM projects WHERE pid = ? AND uid = ?', [pid, req.session.user.id]);
        
        if (project.length === 0) {
            return res.status(403).json({ message: 'You do not have permission to edit this project' });
        }
        await db.query(
            'UPDATE projects SET title = ?, start_date = ?, end_date = ?, short_description = ?, phase = ? WHERE pid = ?',
            [title, start_date, end_date, short_description, phase, pid]
        );
        res.json({ message: 'Project updated successfully' });
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ message: 'Error updating project' });
    }
});
// API endpoint to fetch all projects if user is logged in
app.get('/api/all-projects', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    try {
        const projects = await db.query('SELECT * FROM projects');
        res.json(projects);
    } catch (err) {
        console.error('Error fetching all projects:', err);
        res.status(500).json({ message: 'Error fetching all projects' });
    }
});

// API endpoint to add a new project
app.post('/api/projects', async (req, res) => {
    const { title, start_date, end_date, short_description, phase, uid } = req.body;

    const query = `
        INSERT INTO projects (title, start_date, end_date, short_description, phase, uid)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
        await db.query(query, [title, start_date, end_date, short_description, phase, uid]);
        res.status(201).send('Project created successfully');
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).send('Error creating project');
    }
});
// Error handling middleware for unexpected errors
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error(err.message, err.stack);
    res.status(statusCode).json({ message: err.message });
});
// Start server at specified port
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


