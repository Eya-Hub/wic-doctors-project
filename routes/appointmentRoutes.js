const express = require('express');
const router = express.Router();
const { bookAppointment } = require('../controllers/appointmentController'); // Import the controller

// Route for booking an appointment
router.post('/book', bookAppointment);

// Export the router
module.exports = router;
