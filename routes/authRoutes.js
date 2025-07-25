const express = require('express');
const { signup, doctorSignup, login, doctorLogin, authenticateToken, getSpecialities, getHospitals, getUserInfo, getDoctorInfo,changePassword } = require('../controllers/authController'); // Import the controller
const router = express.Router();

// Route for signup and login
router.post('/signup', signup);
router.post('/doctor-signup', doctorSignup);
router.post('/login', login);
router.post('/doctor-login', doctorLogin);
router.get('/specialities', getSpecialities);
router.get('/hospitals', getHospitals);

// Protected routes
router.get('/user', authenticateToken, getUserInfo);
router.get('/doctor', authenticateToken, getDoctorInfo);
router.post('/change-password', authenticateToken, changePassword); 

// Export the router
module.exports = router;
