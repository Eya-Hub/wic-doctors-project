const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const dotenv = require('dotenv');
dotenv.config();


const generateToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ message: 'Token requis' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token invalide ou expiré' });
        }
        req.user = user;
        next();
    });
};

// Signup API for patients
const signup = async (req, res) => {
    const { nom, prenom, email, password, date_naissance, phone_number, gender } = req.body;

    // Validation des champs
    if (!nom || !prenom || !email || !password || !date_naissance || !phone_number || !gender) {
        return res.status(400).json({ message: 'All required fields must be filled' });
    }

    // Combiner nom et prenom en un seul champ name
    const name = `${nom} ${prenom}`;

    try {
        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insérer dans la table users
        const userInsertQuery = 'INSERT INTO users (name, phone_number, email, password) VALUES (?, ?, ?, ?)';
        pool.query(userInsertQuery, [name, phone_number, email, hashedPassword], (err, result) => {
            if (err){
                console.error('Erreur lors de l\'insertion dans users:', err);
                return res.status(500).json({ message: 'Database error', error: err });
            } 
            const userId = result.insertId;

            // Insérer dans la table patients
            const patientInsertQuery = 'INSERT INTO patients (user_id, name, phone_number, date_naissance, gender) VALUES (?, ?, ?, ?, ?)';
            pool.query(patientInsertQuery, [userId, name, phone_number, date_naissance, gender], (err) => {
                if (err){
                    console.error('Erreur lors de l\'insertion dans patients:', err);
                    return res.status(500).json({ message: 'Error adding patient', error: err });
                } 
                
                const token = generateToken({ id: userId, email });
                return res.status(201).json({ message: 'User registered successfully', token });
            });
        });
    } catch (error) {
        console.error('Erreur serveur:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Signup API for doctors
const doctorSignup = async (req, res) => {
    const { nom, prenom, email, password, date_naissance, phone_number, gender, price, session_duration, speciality_id, description, diplome, hospital_id } = req.body;
    if (!nom || !prenom || !email || !password || !date_naissance || !phone_number || !gender || !price || !session_duration || !speciality_id || !description || !diplome|| !hospital_id) {
        return res.status(400).json({ message: 'All required fields must be filled' });
    }

    // Convert hospital_id and speciality_id to integers
    const hospitalId = parseInt(hospital_id, 10);
    const specialityId = parseInt(speciality_id, 10);

    // Validate that they are valid numbers
    if (isNaN(hospitalId) || isNaN(specialityId)) {
        return res.status(400).json({ message: 'Invalid hospital_id or speciality_id' });
    }

    const name = `${nom} ${prenom}`;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userInsertQuery = 'INSERT INTO users (name, phone_number, email, password) VALUES (?, ?, ?, ?)';
        pool.query(userInsertQuery, [name, phone_number, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('Erreur lors de l\'insertion dans users:', err);
                return res.status(500).json({ message: 'Database error', error: err });
            }
            const userId = result.insertId;
            const doctorInsertQuery = 'INSERT INTO doctors (user_id, name, price, description, session_duration, diplome, hospital_id, speciality_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())';
            pool.query(doctorInsertQuery, [userId, name, price, description, session_duration, diplome, hospitalId, speciality_id], (err) => {
                if (err) {
                    console.error('Erreur lors de l\'insertion dans doctors:', err);
                    return res.status(500).json({ message: 'Error adding doctor', error: err });
                }
                    const token = generateToken({ id: userId, email, role: 'doctor' });
                    return res.status(201).json({ message: 'Doctor registered successfully', token });
                });
        });
    } catch (error) {
        console.error('Erreur serveur:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Login API for patients
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
        const patientQuery = 'SELECT * FROM patients WHERE user_id = ?';
        pool.query(patientQuery, [user.id], (err, patientResults) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            const role = patientResults.length > 0 ? 'patient' : 'doctor';
            const token = generateToken({ id: user.id, email: user.email, role });
            res.json({ message: 'Login successful', token });
        });
    });
};

// Login API for doctors
const doctorLogin = (req, res) => {
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
        const doctorQuery = 'SELECT * FROM doctors WHERE user_id = ?';
        pool.query(doctorQuery, [user.id], (err, doctorResults) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (doctorResults.length === 0) return res.status(401).json({ message: 'Not a doctor account' });
            const token = generateToken({ id: user.id, email: user.email, role: 'doctor' });
            res.json({ message: 'Doctor login successful', token });
        });
    });
};
//Get specialities 
const getSpecialities = (req, res) => {
    const query = 'SELECT id, name FROM specialities';
    pool.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des spécialités:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.json(results);
    });
};

//Get hospitals

const getHospitals = (req, res) => {
    const query = `
            SELECT h.id_hospital, h.Name AS hospital_name
            FROM hospitals h
            JOIN hospital_cnv c ON h.id_hospital = c.id_hospital
        `;
    pool.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des hôpitaux:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.json(results);
    });
};

// Get user information
const getUserInfo = (req, res) => {
    const userId = req.user.id;

    const userQuery = `
        SELECT u.name, u.email, u.phone_number, p.date_naissance
        FROM users u
        JOIN patients p ON u.id = p.user_id
        WHERE u.id = ?
    `;
    pool.query(userQuery, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des informations utilisateur:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const user = results[0];
        res.json(user);
    });
};

// Get doctor information
const getDoctorInfo = (req, res) => {
    const userId = req.user.id;

    const doctorQuery = `
        SELECT u.name, u.email, u.phone_number, d.hospital_id, d.speciality_id, h.Name AS hospital_name, s.name AS speciality_name
        FROM users u
        JOIN doctors d ON u.id = d.user_id
        JOIN hospitals h ON d.hospital_id = h.id_hospital
        JOIN specialities s ON d.speciality_id = s.id
        WHERE u.id = ?
    `;
    pool.query(doctorQuery, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des informations du docteur:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Docteur non trouvé' });
        }

        const doctor = results[0];
        res.json(doctor);
    });
};

// Change password
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Les deux mots de passe sont requis' });
    }

    // Fetch current user
    const userQuery = 'SELECT * FROM users WHERE id = ?';
    pool.query(userQuery, [userId], async (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
        pool.query(updateQuery, [hashedNewPassword, userId], (err) => {
            if (err) {
                console.error('Erreur lors de la mise à jour du mot de passe:', err);
                return res.status(500).json({ message: 'Database error', error: err });
            }
            res.json({ message: 'Mot de passe mis à jour avec succès' });
        });
    });
};

// Export the function
module.exports = { signup, doctorSignup, login, doctorLogin, authenticateToken, getSpecialities, getHospitals, getUserInfo, getDoctorInfo, changePassword };
