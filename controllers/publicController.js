const pool = require('../config/database'); // Import database connection
// Get All Hospitals
const getHospitals = (_, res) => {
    const query = 'SELECT * FROM hospitals';
    pool.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

// Get All Doctors
const getDoctors = (_, res) => {
    const query = 'SELECT * FROM doctors';
    pool.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

module.exports = { getHospitals, getDoctors };
