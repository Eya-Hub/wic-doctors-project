const express = require('express');
const { signup, login } = require('../controllers/authController'); // Import the controller
const router = express.Router();

// Route for signup and login
router.post('/signup', signup);
router.post('/login', login);

// Export the router
module.exports = router;
