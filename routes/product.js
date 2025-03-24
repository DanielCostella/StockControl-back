const express = require('express');
const router = express.Router();
const { 
    getProducts, 
    createProduct, 
    deleteProduct,
    createMovement,
    deleteMovement 
} = require('../controllers/product');

// Rutas de productos
router.get('/', getProducts);
router.post('/', createProduct);
router.delete('/:id', deleteProduct);

// Rutas de movimientos
router.post('/movement/:productId', createMovement);
router.delete('/movement/:id', deleteMovement);

module.exports = router; 