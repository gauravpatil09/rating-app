const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
require('dotenv').config();

// models (import to ensure associations are registered)
const User = require('./models/User');
const Store = require('./models/Store');
const Rating = require('./models/Rating');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const storeRoutes = require('./routes/stores');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stores', storeRoutes);

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  console.log('DB synced');
  app.listen(PORT, () => console.log('Server started on', PORT));
}).catch(err => {
  console.error('DB sync error', err);
});
