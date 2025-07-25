const express = require('express');
const router = express.Router();
const { bookAppointment, getDoctorSchedule, authenticateToken, getUserAppointments, getDoctorAppointments, cancelAppointment } = require('../controllers/appointmentController');

// Route for booking an appointment
router.post('/book', authenticateToken, bookAppointment);

// Route for fetching doctor's schedule
router.get('/schedule', getDoctorSchedule);

// Route for fetching user appointments
router.get('/user', authenticateToken, getUserAppointments);

// Route for fetching doctor appointments
router.get('/doctor', authenticateToken, getDoctorAppointments);

// Route for canceling an appointment (for doctors)
router.delete('/doctor/:id', authenticateToken, cancelAppointment);

// Export the router
module.exports = router;
