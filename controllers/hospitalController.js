const pool = require('../config/database'); //database connection
// Search hospitals by location
const searchHospitalsByLocation = (req, res) => {
    const { location } = req.query; 

    if (!location) {
        return res.status(400).json({ message: 'Location is required for search.' });
    }

    const query = `SELECT * FROM hospitals WHERE Location LIKE ?`;

    const searchValue = `%${location}%`; 

    pool.query(query, [searchValue], (err, results) => {
        if (err) {
            console.error('Error searching hospitals:', err);
            return res.status(500).json({ message: 'Failed to search hospitals.' });
        }
        res.status(200).json(results); 
    });
};

// Export the function
module.exports = {
    searchHospitalsByLocation,
};