require('dotenv').config();
const mysql = require('mysql');
// MySQL connection
const pool = mysql.createPool({
    connectionLimit : 10,
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME
    });

// Check database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to MySQL database');
        connection.release(); // Release the connection back to the pool
    }
});

// Export the pool object
module.exports = pool;

