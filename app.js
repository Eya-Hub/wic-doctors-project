const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config();

// Middleware: Enable JSON parsing
app.use(bodyParser.urlencoded({extended : false}))
app.use(bodyParser.json());

// Debugging middleware to log request body
app.use((req, res, next) => {
    console.log("Request Body:", req.body);
    next();
});

// import routes
const searchRoutes = require('./routes/searchRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Use Routes
app.use('/search', searchRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/auth', authRoutes);
app.use('/public', publicRoutes);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));