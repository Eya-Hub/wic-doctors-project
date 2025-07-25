const pool = require('../config/database'); // Database connection

// Combined search function
const search = (req, res) => {
    const { hospital_name, doctor_name, location, speciality } = req.query;

    console.log('Received query parameters:', req.query);

    // Validate that at least one search parameter is provided
    if (!hospital_name && !doctor_name && !location && !speciality) {
        console.log('Validation failed: No search parameters provided');
        return res.status(400).json({ message: 'At least one search parameter is required (hospital_name, doctor_name, location, or speciality).' });
    }

    let sqlQuery;
    let searchValues = [];

    // Hospital search logic
    if (hospital_name || location || speciality) {
        console.log('Performing hospital search');
        sqlQuery = `
            SELECT 
                d.id AS doctor_id,
                h.id_hospital,
                d.name AS doctor_name, 
                d.price, 
                d.description, 
                d.session_duration, 
                s.name AS speciality, 
                h.Name AS hospital_name, 
                h.Sector, 
                h.Location, 
                h.adresse, 
                h.Phone
            FROM 
                doctors d
            JOIN 
                specialities s ON s.id = d.speciality_id
            JOIN 
                hospital_cnv hc ON hc.id_hospital = d.hospital_id
            JOIN 
                hospitals h ON h.id_hospital = hc.id_hospital
            WHERE 
                1=1
        `;

        // Add conditions based on provided parameters
        if (hospital_name) {
            sqlQuery += ` AND h.Name LIKE ?`;
            searchValues.push(`%${hospital_name}%`);
        }
        if (location) {
            sqlQuery += ` AND h.Location LIKE ?`;
            searchValues.push(`%${location}%`);
        }
        if (speciality) {
            sqlQuery += ` AND s.name LIKE ?`;
            searchValues.push(`%${speciality}%`);
        }
    }
    // Doctor search logic (unchanged for now, but can be updated similarly if needed)
    else if (doctor_name) {
        console.log('Performing doctor search');
        sqlQuery = `
            SELECT 
                d.id AS doctor_id,
                h.id_hospital AS hospital_id,
                d.name AS doctor_name, 
                d.price,  
                d.description, 
                d.session_duration, 
                s.name AS speciality, 
                h.Name AS hospital_name, 
                h.Sector, 
                h.Location, 
                h.adresse, 
                h.Phone
            FROM 
                doctors d
            JOIN 
                specialities s ON s.id = d.speciality_id
            JOIN 
                hospital_cnv hc ON hc.id_hospital = d.hospital_id
            JOIN 
                hospitals h ON h.id_hospital = hc.id_hospital
            WHERE 
                1=1
        `;

        if (doctor_name) {
            console.log('Doctor name provided:', doctor_name);
            if (doctor_name.length < 3) {
                console.log('Validation failed: Doctor name too short');
                return res.status(400).json({ message: 'Please enter at least 3 characters to search for doctors.' });
            }
            sqlQuery += ` AND d.name LIKE ?`;
            searchValues.push(`%${doctor_name}%`);
        }
        if (location) {
            console.log('Location provided:', location);
            sqlQuery += ` AND h.Location LIKE ?`;
            searchValues.push(`%${location}%`);
        }
        if (speciality) {
            console.log('Speciality provided:', speciality);
            sqlQuery += ` AND s.name LIKE ?`;
            searchValues.push(`%${speciality}%`);
        }
    }

    console.log('Executing query:', sqlQuery);
    console.log('Search values:', searchValues);

    // Execute the query
    pool.query(sqlQuery, searchValues, (err, results) => {
        if (err) {
            console.error('Error performing search:', err);
            console.error('SQL Error Code:', err.code);
            console.error('SQL Error Message:', err.sqlMessage);
            return res.status(500).json({ 
                message: 'Failed to perform search.', 
                error: err.message, 
                sqlErrorCode: err.code, 
                sqlErrorMessage: err.sqlMessage 
            });
        }

        console.log('Query results:', results);
        console.log('Search query received:', req.query);

        res.status(200).json(results);
    });
};

// Export the function
module.exports = { search };