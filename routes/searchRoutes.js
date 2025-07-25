const express = require('express');
const { search } = require('../controllers/searchController'); // Import the controller
const router = express.Router();

// Route for combined search
router.get('/search', search);
// Export the router
module.exports = router;