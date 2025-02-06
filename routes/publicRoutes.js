const express = require('express');
const { getHospitals, getDoctors } = require('../controllers/publicController'); // Import controller
const router = express.Router();

// Define API endpoints
router.get('/hospitals', getHospitals);
router.get('/doctors', getDoctors);

module.exports = router;
