// Import modules
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../services/db');
// Defining POST route for user registration
router.post('/', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        // Check if username already exists
        const [existingUsername] = await db.query('SELECT username FROM users WHERE username = ?', [username]);

        // If username exists then return username already exists message
        if (existingUsername && existingUsername.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Check if email already exists
        const [existingEmail] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
        // If email exists then return email already exists message
        if (existingEmail && existingEmail.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Proceed with registration
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [username, hashedPassword, email]
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.sqlMessage.includes('email')) {
                return res.status(400).json({ message: 'Email address already exists' });
            }
            if (err.sqlMessage.includes('username')) {
                return res.status(400).json({ message: 'Username already exists' });
            }
        }
        // General error handling
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});
  
  

module.exports = router;
