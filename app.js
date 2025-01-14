const express = require('express');
const bodyParser = require('body-parser');
const hospitalRoutes = require('./routes/hospitalRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.urlencoded({extended : false}))
app.use(bodyParser.json());

// Routes
app.use('/hospitals', hospitalRoutes);

// Start server
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));