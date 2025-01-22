const pool = require('../config/database'); // Database connection

// Search hospitals by location
const searchHospitalsByLocation = (req, res) => {
    const { location } = req.query;

    // Validate the input
    if (!location) {
        return res.status(400).json({ message: 'Location is required for search.' });
    }

    // SQL query to search for hospitals by location
    const query = `
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
            hospitals.location LIKE ?
    `;

    const searchValue = `%${location}%`; // Use wildcard for partial matching

    console.log('Executing query:', query); // Log the query
    console.log('Search value:', searchValue); // Log the search value

    // Execute the query
    pool.query(query, [searchValue], (err, results) => {
        if (err) {
            console.error('Error searching hospitals by location:', err);
            return res.status(500).json({ message: 'Failed to search hospitals by location.' });
        }

        // Log the results for debugging
        console.log('Query results:', results);

        // Return the results as JSON
        res.status(200).json(results);
    });
};

// Export the function
module.exports = {
    searchHospitalsByLocation,
};