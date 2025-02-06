const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const dotenv = require('dotenv');
dotenv.config();


const generateToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Signup API
const signup = async (req, res) => {
    const { name, phone_number, email, password, date_naissance, gender, note } = req.body;

    if (!name || !phone_number || !email || !password) {
        return res.status(400).json({ message: 'All required fields must be filled' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userInsertQuery = 'INSERT INTO users (name, phone_number, email, password) VALUES (?, ?, ?, ?)';
        
        pool.query(userInsertQuery, [name, phone_number, email, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            const userId = result.insertId;

            const patientInsertQuery = 'INSERT INTO patients (user_id, name, phone_number, date_naissance, gender, notes) VALUES (?, ?, ?, ?, ?, ?)';
            pool.query(patientInsertQuery, [userId, name, phone_number, date_naissance, gender, note], (err) => {
                if (err) return res.status(500).json({ message: 'Error adding patient', error: err });
                
                const token = generateToken({ id: userId, email });
                return res.status(201).json({ message: 'User registered successfully', token });
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Login API
const login = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    const userQuery = 'SELECT * FROM users WHERE email = ?';
    pool.query(userQuery, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = generateToken(user);
        res.json({ message: 'Login successful', token });
    });
};

// Export the function
module.exports = { signup, login };
