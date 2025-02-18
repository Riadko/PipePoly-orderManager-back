const express = require('express');
const cors = require('cors');
const path = require('path');
const ordersRoutes = require('./routes/orders');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/orders', ordersRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all handler to redirect all other requests to the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
