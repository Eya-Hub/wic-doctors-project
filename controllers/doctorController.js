const pool = require('../config/database');

// Search doctors by name and include hospital name
const searchDoctorsByName = (req, res) => {
    const { name } = req.query; 

    if (!name || name.length < 3) {
        return res.status(400).json({ message: 'Please enter at least 3 characters to search.' });
    }

    const query = "SELECT doctors.name,doctors.price,doctors.discount_price,doctors.description,doctors.session_duration,specialities.name as speciality, hospitals.Name FROM `doctors`,`specialities`,`hospitals`,`hospital_cnv` WHERE doctors.name LIKE ? AND specialities.id = doctors.speciality_id AND hospital_cnv.id_hospital = doctors.hospital_id AND hospitals.id_hospital = hospital_cnv.id_hospital;";
    const searchValue = `${name}%`;

    console.log('Executing query:', query); // Log the query
    console.log('Search value:', searchValue); // Log the search value
    
    pool.query(query, [searchValue], (err, results) => {
        if (err) {
            console.error('Error searching doctors:', err);
            return res.status(500).json({ message: 'Failed to search doctors.' });
        }
        //console.log('Query results:', results);
        res.status(200).json(results); 
    });
};

// Export the function
module.exports = {
    searchDoctorsByName,
};