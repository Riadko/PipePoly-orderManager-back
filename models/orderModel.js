const pool = require('../config/db');

// Get all orders
const getAllOrders = async () => {
  const result = await pool.query('SELECT * FROM orders');
  return result.rows;
};

// Get orders by status
const getOrdersByStatus = async (validated, finished) => {
  const result = await pool.query('SELECT * FROM orders WHERE validated = $1 AND finished = $2', [validated, finished]);
  return result.rows;
};

// Add a new order
const addOrder = async (order) => {
  const { order_number, client_name, product, quantity, order_date, delivery_date, status, remarks } = order;
  const result = await pool.query(
    'INSERT INTO orders (order_number, client_name, product, quantity, order_date, delivery_date, status, remarks) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [order_number, client_name, product, quantity, order_date, delivery_date, status, remarks]
  );
  return result.rows[0];
};

// Validate an order
const validateOrder = async (id) => {
  const result = await pool.query('UPDATE orders SET validated = true, validated_date = NOW() WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

// Finish an order
const finishOrder = async (id) => {
  const result = await pool.query('UPDATE orders SET finished = true, finished_date = NOW() WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getAllOrders,
  getOrdersByStatus,
  addOrder,
  validateOrder,
  finishOrder
};