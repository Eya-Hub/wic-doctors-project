const express = require('express');
const app = express();
const bodyParser = require('body-parser');
// import routes
const searchRoutes = require('./routes/searchRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

// Middleware: Enable JSON parsing
app.use(bodyParser.urlencoded({extended : false}))
app.use(bodyParser.json());

// Use Routes
app.use('/search', searchRoutes);
app.use('/appointments', appointmentRoutes);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));