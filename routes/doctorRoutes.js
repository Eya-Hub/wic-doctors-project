const express = require('express');
const router = express.Router();
const { searchDoctorsByName } = require('../controllers/doctorController'); // Import the controller

// Route for searching doctors by name
router.get('/search', searchDoctorsByName);

// Export the router
module.exports = router;