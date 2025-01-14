const mysql = require('mysql');
//MySQL connection
const pool = mysql.createPool({
    connectionLimit : 10,
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'wic-doctor',
    });
// Export the pool object
module.exports = pool;

