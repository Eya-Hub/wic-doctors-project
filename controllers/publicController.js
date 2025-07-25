const pool = require('../config/database'); // Import database connection
// Get All Hospitals with Pagination
const getHospitals = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Query to get paginated hospitals
    const query = 'SELECT * FROM hospitals LIMIT ? OFFSET ?';
    pool.query(query, [limit, offset], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }

        // Query to get the total count of hospitals
        const countQuery = 'SELECT COUNT(*) AS total FROM hospitals';
        pool.query(countQuery, (err, countResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error', error: err });
            }

            const totalHospitals = countResult[0].total;
            const totalPages = Math.ceil(totalHospitals / limit);

            // Send the response with hospitals and pagination details
            res.json({
                hospitals: results,
                totalHospitals,
                totalPages,
                currentPage: page
            });
        });
    });
};


// Get All Doctors with Pagination
const getDoctors = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Query to get paginated doctors
    const query = 'SELECT doctors.id, doctors.name, doctors.description, specialities.name AS speciality_name FROM doctors JOIN specialities ON doctors.speciality_id = specialities.id LIMIT ? OFFSET ?';
    pool.query(query, [limit, offset], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }

        // Log the results to verify the data
        console.log("Doctors with Specialties from DB:", results);

        // Query to get the total count of doctors
        const countQuery = 'SELECT COUNT(*) AS total FROM doctors';
        pool.query(countQuery, (err, countResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error', error: err });
            }

            const totalDoctors = countResult[0].total;
            const totalPages = Math.ceil(totalDoctors / limit);

            // Send the response with doctors and pagination details
            res.json({
                doctors: results,
                totalDoctors,
                totalPages,
                currentPage: page
            });
        });
    });
};

module.exports = { getHospitals, getDoctors };
