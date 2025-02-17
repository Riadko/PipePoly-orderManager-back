const express = require('express');
const { getAllOrders, getOrdersByStatus, addOrder, validateOrder, finishOrder } = require('../models/orderModel');
const router = express.Router();
const pool = require('../config/db');

// Function to send an email via Formspree
async function sendOrderEmail(order) {
    const fetch = (await import('node-fetch')).default; // Dynamic import for ESM compatibility

    try {
        const response = await fetch("https://formspree.io/f/xkgopopb", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                subject: `New Order, Number: ${order.order_number}`,
                message: `
                A new order has been placed.

                Order Number : ${order.order_number}
                Client : ${order.client_name}
                Product : ${order.product}
                Quantity : ${order.quantity}
                Order Date : ${order.order_date}
                Delivery Date : ${order.delivery_date}
                Status : ${order.status}
                Remarks : ${order.remarks}
                `,
            }),
        });

        if (response.ok) {
            console.log("✅ Order email sent via Formspree!");
        } else {
            console.error("❌ Formspree Error:", await response.text());
        }
    } catch (error) {
        console.error("❌ Email Sending Failed:", error.message);
    }
}

// Get all orders
router.get('/', async (req, res) => {
    try {
        const orders = await getAllOrders();
        res.json(orders);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get orders by status
router.get('/pending', async (req, res) => {
    try {
        const orders = await getOrdersByStatus(false, false);
        res.json(orders);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/validated', async (req, res) => {
    try {
        const orders = await getOrdersByStatus(true, false);
        res.json(orders);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/finished', async (req, res) => {
    try {
        const orders = await getOrdersByStatus(true, true);
        res.json(orders);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Add new order and send email
router.post('/', async (req, res) => {
  try {
    let { order_number, client_name, product, quantity, order_date, delivery_date, status, remarks } = req.body;

    // Ensure that the order_date and delivery_date are valid dates
    const localOrderDate = new Date(order_date);
    const localDeliveryDate = new Date(delivery_date);

    if (isNaN(localOrderDate.getTime()) || isNaN(localDeliveryDate.getTime())) {
      throw new Error('Invalid date format');
    }

    // Insert the order into the database
    const result = await pool.query(
      "INSERT INTO orders (order_number, client_name, product, quantity, order_date, delivery_date, status, remarks) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [order_number, client_name, product, quantity, localOrderDate, localDeliveryDate, status, remarks]
    );

    const newOrder = result.rows[0];

    // Send the confirmation email
    await sendOrderEmail(newOrder);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error adding order:", error.message);
    res.status(500).send(error.message);
  }
});

// Validate Order (Move to "validated" status)
router.put("/:id/validate", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedDate = new Date();
  
      // Run the query to update the order's status and validated date
      const result = await pool.query(
        "UPDATE orders SET validated = true, validated_date = $1 WHERE id = $2 RETURNING *",
        [validatedDate, id]
      );
  
      res.json(result.rows[0]); // Return updated order
    } catch (err) {
      // Log the error to see more details
      console.error("Error in validating order:", err);
  
      // Send more detailed error message to the frontend
      res.status(500).json({
        error: "Internal Server Error",
        message: err.message,
        stack: err.stack // You can also include the stack trace for more insight
      });
    }
  });
  

// Finish order
router.put('/:id/finish', async (req, res) => {
    try {
        const { id } = req.params;
        const finishedDate = new Date(); // Get current date for finished date

        const result = await pool.query(
            "UPDATE orders SET finished = true, finished_date = $1 WHERE id = $2 RETURNING *",
            [finishedDate, id]
        );

        res.json(result.rows[0]); // Send the updated order back
    } catch (error) {
        console.error("Error adding order:", error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;