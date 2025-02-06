const pool = require('../config/database'); // Database connection

// Combined search function
const search = (req, res) => {
    const { hospital_name, doctor_name, location, speciality} = req.query;

    // Validate that at least one search parameter is provided
    if (!hospital_name && !doctor_name && !location && !speciality) {
        return res.status(400).json({ message: 'At least one search parameter is required (hospital_name, doctor_name,location, or speciality ).' });
    }

    let sqlQuery;
    let searchValues = [];

    if (hospital_name && doctor_name) {
        // Search for doctors in a specific hospital by name
        sqlQuery = `
            SELECT 
                doctors.name AS doctor_name, 
                doctors.price, 
                doctors.discount_price, 
                doctors.description, 
                doctors.session_duration, 
                specialities.name AS speciality, 
                hospitals.Name AS hospital_name, 
                hospitals.Sector, 
                hospitals.Location, 
                hospitals.adresse, 
                hospitals.Phone
            FROM 
                doctors
            JOIN 
                specialities ON specialities.id = doctors.speciality_id
            JOIN 
                hospital_cnv ON hospital_cnv.id_hospital = doctors.hospital_id
            JOIN 
                hospitals ON hospitals.id_hospital = hospital_cnv.id_hospital
            WHERE 
                doctors.name LIKE ? AND hospitals.Name LIKE ?
        `;
        searchValues.push(`%${doctor_name}%`, `%${hospital_name}%`);
    } 
    else if (hospital_name) {
        
        // Search for hospitals by name
        sqlQuery = `
    SELECT 
        hospitals.Name, 
        hospitals.Sector, 
        hospitals.Location, 
        hospitals.adresse, 
        hospitals.Phone
    FROM 
        hospitals, hospital_cnv
    WHERE 
        hospitals.Name LIKE ? AND hospital_cnv.id_hospital = hospitals.id_hospital
        `;
        searchValues.push(`%${hospital_name}%`);
    } 
    
    else if (doctor_name) {
        // Validate that at least 3 characters are provided for doctor search
        if (doctor_name.length < 3) {
            return res.status(400).json({ message: 'Please enter at least 3 characters to search for doctors.' });
        }

        // Search for doctors by name
        sqlQuery = `
            SELECT 
                doctors.name, 
                doctors.price, 
                doctors.discount_price, 
                doctors.description, 
                doctors.session_duration, 
                specialities.name AS speciality, 
                hospitals.Name AS hospital_name
            FROM 
                doctors
            JOIN 
                specialities ON specialities.id = doctors.speciality_id
            JOIN 
                hospital_cnv ON hospital_cnv.id_hospital = doctors.hospital_id
            JOIN 
                hospitals ON hospitals.id_hospital = hospital_cnv.id_hospital
            WHERE 
                doctors.name LIKE ?
        `;
        searchValues.push(`%${doctor_name}%`);
    }
    else if (location && speciality) {
        // Search for doctors by speciality and location
        sqlQuery = `
            SELECT 
                doctors.name AS doctor_name, 
                doctors.price, 
                doctors.discount_price, 
                doctors.description, 
                doctors.session_duration, 
                specialities.name AS speciality, 
                hospitals.Name AS hospital_name, 
                hospitals.Sector, 
                hospitals.Location, 
                hospitals.adresse, 
                hospitals.Phone
            FROM 
                doctors
            JOIN 
                specialities ON specialities.id = doctors.speciality_id
            JOIN 
                hospital_cnv ON hospital_cnv.id_hospital = doctors.hospital_id
            JOIN 
                hospitals ON hospitals.id_hospital = hospital_cnv.id_hospital
            WHERE 
                specialities.name LIKE ? AND hospitals.Location LIKE ?
        `;
        searchValues.push(`%${speciality}%`, `%${location}%`);
    }
    
    else if (location) {
        // Search for hospitals by location
        sqlQuery = `
            SELECT 
                hospitals.Name, 
                hospitals.Sector, 
                hospitals.Location, 
                hospitals.adresse, 
                hospitals.Phone
            FROM 
                hospitals
            JOIN 
                hospital_cnv ON hospitals.id_hospital = hospital_cnv.id_hospital 
            WHERE 
                hospitals.Location LIKE ?
        `;
        searchValues.push(`%${location}%`);
    }
    else if (speciality) {
        // Search for doctors by speciality
        sqlQuery = `
            SELECT 
                doctors.name AS doctor_name, 
                doctors.price, 
                doctors.discount_price, 
                doctors.description, 
                doctors.session_duration, 
                specialities.name AS speciality, 
                hospitals.Name AS hospital_name, 
                hospitals.Sector, 
                hospitals.Location, 
                hospitals.adresse, 
                hospitals.Phone
            FROM 
                doctors
            JOIN 
                specialities ON specialities.id = doctors.speciality_id
            JOIN 
                hospital_cnv ON hospital_cnv.id_hospital = doctors.hospital_id
            JOIN 
                hospitals ON hospitals.id_hospital = hospital_cnv.id_hospital
            WHERE 
                specialities.name LIKE ?
        `;
        searchValues.push(`%${speciality}%`);
    }
    


    console.log('Executing query:', sqlQuery); // Log the query
    console.log('Search values:', searchValues); // Log the search values

    // Execute the query
    pool.query(sqlQuery, searchValues, (err, results) => {
        if (err) {
            console.error('Error performing search:', err);
            return res.status(500).json({ message: 'Failed to perform search.' });
        }

        // Log the results for debugging
        console.log('Query results:', results);

        // Return the results as JSON
        res.status(200).json(results);
    });
};

// Export the function
module.exports = {search,};