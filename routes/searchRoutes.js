const express = require('express');
const router = express.Router();
const { search } = require('../controllers/searchController'); // Import the controller

// Route for combined search
router.get('/search', search);

// Export the router
module.exports = router;