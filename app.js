const cors = require('cors');
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

// Middleware: Enable JSON parsing
app.use(bodyParser.urlencoded({extended : true}))
app.use(bodyParser.json());

// Debugging middleware to log request body
app.use((req, res, next) => {
    console.log("Request Body:", req.body);
    next();
});

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// import routes
const searchRoutes = require('./routes/searchRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');


// Use Routes
app.use(cors({origin: 'http://127.0.0.1:5500'}));
app.use('/search', searchRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/auth', authRoutes);
app.use('/public', publicRoutes);


// Start server
const port = process.env.PORT || 5000;
console.log('Loaded JWT_SECRET:', process.env.JWT_SECRET);
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));