const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moonstar-pos';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Schemas
const storeSchema = new mongoose.Schema({
  id: Number,
  name: String,
  location: String,
  icon: String
});

const inventorySchema = new mongoose.Schema({
  id: Number,
  name: String,
  price: Number,
  quantity: Number,
  icon: String,
  storeId: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const saleSchema = new mongoose.Schema({
  storeId: Number,
  items: [
    {
      id: Number,
      name: String,
      price: Number,
      quantity: Number,
      icon: String
    }
  ],
  subtotal: Number,
  discount: Number,
  total: Number,
  discountPercent: Number,
  createdAt: { type: Date, default: Date.now }
});

// Models
const Store = mongoose.model('Store', storeSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);
const Sale = mongoose.model('Sale', saleSchema);

// Initialize default data
const initializeData = async () => {
  const storeCount = await Store.countDocuments();
  if (storeCount === 0) {
    const stores = [
      { id: 1, name: 'Downtown', location: 'Downtown Branch', icon: '🏢' },
      { id: 2, name: 'Mall', location: 'Shopping Mall', icon: '🛍️' },
      { id: 3, name: 'Market', location: 'Central Market', icon: '🏪' },
      { id: 4, name: 'Plaza', location: 'Business Plaza', icon: '🏬' },
      { id: 5, name: 'Center', location: 'City Center', icon: '🌆' },
      { id: 6, name: 'Suburbs', location: 'Suburban Area', icon: '🏘️' }
    ];
    await Store.insertMany(stores);
    console.log('✅ Default stores created');
  }

  const inventoryCount = await Inventory.countDocuments();
  if (inventoryCount === 0) {
    const inventoryData = [];
    const items = [
      { id: 1, name: 'T-Shirt', price: 5, icon: '👕' },
      { id: 2, name: 'Jeans', price: 15, icon: '👖' },
      { id: 3, name: 'Jacket', price: 25, icon: '🧥' },
      { id: 4, name: 'Shoes', price: 20, icon: '👞' },
      { id: 5, name: 'Sweater', price: 18, icon: '🧶' }
    ];

    const quantities = [150, 85, 40, 60, 90, 120, 70, 35, 55, 80, 180, 95, 50, 70, 100, 140, 75, 45, 65, 85, 160, 80, 42, 58, 92, 130, 68, 38, 50, 75];
    let qtyIndex = 0;

    for (let storeId = 1; storeId <= 6; storeId++) {
      items.forEach(item => {
        inventoryData.push({
          ...item,
          quantity: quantities[qtyIndex++],
          storeId
        });
      });
    }

    await Inventory.insertMany(inventoryData);
    console.log('✅ Default inventory created');
  }
};

initializeData();

// Routes

// Get all stores
app.get('/api/stores', async (req, res) => {
  try {
    const stores = await Store.find();
    res.json({ success: true, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get inventory by store
app.get('/api/inventory', async (req, res) => {
  try {
    const inventory = await Inventory.find();
    const grouped = {};
    inventory.forEach(item => {
      if (!grouped[item.storeId]) grouped[item.storeId] = [];
      grouped[item.storeId].push(item);
    });
    res.json({ success: true, data: grouped });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update inventory
app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { quantity, storeId } = req.body;
    const updated = await Inventory.findOneAndUpdate(
      { id: parseInt(req.params.id), storeId },
      { quantity, updatedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all sales
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new sale
app.post('/api/sales', async (req, res) => {
  try {
    const { storeId, items, subtotal, discount, total, discountPercent } = req.body;
    
    // Save sale
    const sale = new Sale({
      storeId,
      items,
      subtotal,
      discount,
      total,
      discountPercent
    });
    
    const savedSale = await sale.save();

    // Update inventory
    for (const item of items) {
      await Inventory.findOneAndUpdate(
        { id: item.id, storeId },
        { $inc: { quantity: -item.quantity }, updatedAt: new Date() }
      );
    }

    res.json({ success: true, data: savedSale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get sales by store
app.get('/api/sales/store/:storeId', async (req, res) => {
  try {
    const sales = await Sale.find({ storeId: parseInt(req.params.storeId) }).sort({ createdAt: -1 });
    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
