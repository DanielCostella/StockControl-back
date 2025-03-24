const pool = require('../db'); // Importa el pool de conexiones

// Controlador para obtener todos los productos
const getProducts = (req, res) => {
    const query = `
        SELECT 
            p.id, 
            p.name, 
            p.price, 
            COALESCE(p.stock, 0) as stock
        FROM products p
        ORDER BY p.id DESC
        LIMIT 10`;
    
    pool.query(query, (err, results) => {
        if (err) {
            console.error("Error en getProducts:", err);
            return res.status(500).json({ ok: false, error: err });
        }
        console.log("Productos encontrados:", results);
        res.status(200).json({ ok: true, products: results, count: results.length });
    });
}; 
// Controlador para crear un nuevo producto
const createProduct = (req, res) => {
    if (!req.body.name) {
        return res.status(400).json({
            ok: false,
            message: 'El campo Nombre del producto es obligatorio',
        });
    }

    const { name, price } = req.body; // Obtén el nombre y el precio del cuerpo de la solicitud

    const query = 'INSERT INTO products (name, price) VALUES (?, ?)';
    pool.query(query, [name, price], (err, result) => { // Cambia connection.query a pool.query
        if (err) {
            console.error(err);
            return res.status(500).json({ ok: false, error: err });
        }
        res.status(201).json({ ok: true, product: { id: result.insertId, name, price } });
    });
};

// Controlador para eliminar un producto
const deleteProduct = (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM products WHERE id = ?'; // Asegúrate de que la consulta sea correcta
    pool.query(query, [id], (err, result) => { // Cambia connection.query a pool.query
        if (err) {
            console.error(err);
            return res.status(500).json({ ok: false, error: err });
        }
        res.status(200).json({ ok: true });
    });
};


const createMovement = (req, res) => {
    const { productId } = req.params;
    const { type, quantity } = req.body;

    // Validación de datos
    if (!productId || !type || !quantity) {
        return res.status(400).json({ 
            ok: false, 
            message: 'Faltan datos requeridos' 
        });
    }

    // Asegurarnos de que productId sea un número
    const numericProductId = parseInt(productId);

    // Primero verificamos si el producto existe
    pool.query('SELECT * FROM products WHERE id = ?', [numericProductId], (err, results) => {
        if (err) {
            console.error("Error al buscar producto:", err);
            return res.status(500).json({ ok: false, error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ 
                ok: false, 
                message: `Producto no encontrado` 
            });
        }

        const product = results[0];
        let newStock = parseInt(product.stock || 0);
        const movementQuantity = parseInt(quantity);

        // Validamos la cantidad
        if (isNaN(movementQuantity) || movementQuantity <= 0) {
            return res.status(400).json({ 
                ok: false, 
                message: 'La cantidad debe ser un número positivo' 
            });
        }

        // Calculamos el nuevo stock
        if (type === 'Compra') {
            newStock += movementQuantity;
        } else if (type === 'Venta') {
            if (newStock < movementQuantity) {
                return res.status(400).json({ 
                    ok: false, 
                    message: 'Stock insuficiente' 
                });
            }
            newStock -= movementQuantity;
        } else {
            return res.status(400).json({ 
                ok: false, 
                message: 'Tipo de movimiento inválido' 
            });
        }

        // Iniciamos la transacción
        pool.getConnection((err, connection) => {
            if (err) {
                console.error("Error al obtener conexión:", err);
                return res.status(500).json({ ok: false, error: err.message });
            }

            connection.beginTransaction(err => {
                if (err) {
                    connection.release();
                    console.error("Error al iniciar transacción:", err);
                    return res.status(500).json({ ok: false, error: err.message });
                }

                // Insertamos el movimiento
                const movementQuery = 'INSERT INTO movements (product_id, type, quantity) VALUES (?, ?, ?)';
                connection.query(movementQuery, [numericProductId, type, movementQuantity], (err, movementResult) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error("Error al insertar movimiento:", err);
                            res.status(500).json({ ok: false, error: err.message });
                        });
                    }

                    // Actualizamos el stock
                    const updateQuery = 'UPDATE products SET stock = ? WHERE id = ?';
                    connection.query(updateQuery, [newStock, numericProductId], (err) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error("Error al actualizar stock:", err);
                                res.status(500).json({ ok: false, error: err.message });
                            });
                        }

                        // Confirmamos la transacción
                        connection.commit(err => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error("Error al confirmar transacción:", err);
                                    res.status(500).json({ ok: false, error: err.message });
                                });
                            }
                            
                            connection.release();
                            res.status(201).json({ 
                                ok: true, 
                                movement: {
                                    id: movementResult.insertId,
                                    product_id: numericProductId,
                                    type,
                                    quantity: movementQuantity,
                                    new_stock: newStock
                                }
                            });
                        });
                    });
                });
            });
        });
    });
};

// Controlador para eliminar un producto
const deleteMovement = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM movements WHERE id = ?'; 
    pool.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ ok: false, error: err });
        }
        res.status(200).json({ ok: true });
    });
};


module.exports = {
    getProducts,
    createProduct,
    deleteProduct,
    createMovement,
    deleteMovement
};