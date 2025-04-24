// Import dependencies
const express = require('express'); 
const router = express.Router();  
const db = require('../services/db'); 
const bcrypt = require('bcrypt'); 
// POST route for logging in
router.post('/', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if username exists
        const rows = await db.query(
        'SELECT * FROM users WHERE username = ?', [username]
        );

        const user = rows[0];

        if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
        
        }
        // Compare provided password with hashed password from database
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
        
        }
    // If credentials are valid, save the user's session with their ID and username
        req.session.user = { id: user.uid, username: user.username };
        // respond with success message and reroute user to profile page
        res.json({ message: 'Login successful', redirect: '/profile.html' });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
// POST route for logging out
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
        return res.status(500).json({ message: 'Logout failed' });
        }
        res.json({ message: 'Logged out' });
    });
});
// Export the router so it can be used in other parts of the application
module.exports = router;  

  
  
  
  


