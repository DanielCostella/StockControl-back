const mysql = require('mysql2');
require('dotenv').config();

// Configuración de la conexión a la base de datos usando un pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Conectar a la base de datos (opcional, ya que el pool maneja conexiones automáticamente)
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error de conexión: ' + err.stack);
        return;
    }
    console.log('Conectado a la base de datos como ID ' + connection.threadId);
    connection.release(); // Libera la conexión de vuelta al pool
});

// Exportar el pool para usarlo en otros archivos
module.exports = pool;