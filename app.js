const express = require('express');
const bodyParser = require('body-parser');
// import routes
const hospitalRoutes = require('./routes/hospitalRoutes');
const doctorRoutes = require('./routes/doctorRoutes'); 
const locationRoutes = require('./routes/locationRoutes'); 
const searchRoutes = require('./routes/searchRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.urlencoded({extended : false}))
app.use(bodyParser.json());

// Routes
app.use('/hospitals', hospitalRoutes);
app.use('/doctors', doctorRoutes);
app.use('/locations', locationRoutes); 
app.use('/search', searchRoutes);

// Start server
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));