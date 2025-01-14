const express = require('express');
const router = express.Router();
const { searchHospitalsByLocation } = require('../controllers/hospitalController'); // Import the controller

// Route for searching hospitals by location
router.get('/search', searchHospitalsByLocation);

// Export the router
module.exports = router;