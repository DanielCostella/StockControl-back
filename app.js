const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/product'); // Asegúrate de que la ruta sea correcta
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Usar las rutas de productos
app.use('/api/v1/products', productRoutes); // Todas las rutas de productos comenzarán con /api/v1/products

const PORT = process.env.PORT || 3000; // Establecer un puerto por defecto
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});