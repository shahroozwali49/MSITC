import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [currentView, setCurrentView] = useState('checkout');
  const [selectedStore, setSelectedStore] = useState(1);
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stores, setStores] = useState([]);
  const [inventory, setInventory] = useState({});
  const [sales, setSales] = useState([]);

  // Fetch data from backend
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [storesRes, inventoryRes, salesRes] = await Promise.all([
        fetch(`${API_URL}/stores`),
        fetch(`${API_URL}/inventory`),
        fetch(`${API_URL}/sales`)
      ]);

      if (!storesRes.ok || !inventoryRes.ok || !salesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const storesData = await storesRes.json();
      const inventoryData = await inventoryRes.json();
      const salesData = await salesRes.json();

      setStores(storesData.data || [
        { id: 1, name: 'Downtown', location: 'Downtown Branch', icon: '🏢' },
        { id: 2, name: 'Mall', location: 'Shopping Mall', icon: '🛍️' },
        { id: 3, name: 'Market', location: 'Central Market', icon: '🏪' },
        { id: 4, name: 'Plaza', location: 'Business Plaza', icon: '🏬' },
        { id: 5, name: 'Center', location: 'City Center', icon: '🌆' },
        { id: 6, name: 'Suburbs', location: 'Suburban Area', icon: '🏘️' }
      ]);
      
      setInventory(inventoryData.data || {});
      setSales(salesData.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Using offline mode.');
      setLoading(false);
      // Set default values for offline mode
      setStores([
        { id: 1, name: 'Downtown', location: 'Downtown Branch', icon: '🏢' },
        { id: 2, name: 'Mall', location: 'Shopping Mall', icon: '🛍️' },
        { id: 3, name: 'Market', location: 'Central Market', icon: '🏪' },
        { id: 4, name: 'Plaza', location: 'Business Plaza', icon: '🏬' },
        { id: 5, name: 'Center', location: 'City Center', icon: '🌆' },
        { id: 6, name: 'Suburbs', location: 'Suburban Area', icon: '🏘️' }
      ]);
    }
  };

  const currentStore = stores.find(s => s.id === selectedStore);
  const currentInventory = inventory[selectedStore] || [];

  const addToCart = (item) => {
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
      if (existingItem.quantity < item.quantity) {
        setCart(cart.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ));
      }
    } else {
      setCart([...cart, { ...item, quantity: 1, storeId: selectedStore }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(i => i.id !== itemId));
  };

  const updateCartQuantity = (itemId, qty) => {
    if (qty <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(i => i.id === itemId ? { ...i, quantity: qty } : i));
    }
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = subtotal * (discountPercent / 100);
    return { subtotal, discount, total: subtotal - discount };
  };

  const completeSale = async () => {
    if (cart.length === 0) return;
    
    const { total, discount } = calculateTotal();
    const saleData = {
      storeId: selectedStore,
      items: cart,
      subtotal: calculateTotal().subtotal,
      discount,
      total,
      discountPercent
    };

    try {
      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const newSale = await response.json();
        setSales([...sales, newSale.data]);

        // Update inventory
        const updatedInventory = { ...inventory };
        cart.forEach(item => {
          updatedInventory[selectedStore] = updatedInventory[selectedStore].map(invItem =>
            invItem.id === item.id 
              ? { ...invItem, quantity: invItem.quantity - item.quantity }
              : invItem
          );
        });
        setInventory(updatedInventory);

        setCart([]);
        setDiscountPercent(0);
        alert(`✅ Sale Completed!\n\nTotal: PKR ${total.toFixed(2)}\n\nThank you!`);
      }
    } catch (err) {
      alert('Error saving sale. Please try again.');
    }
  };

  const updateInventory = async (itemId, newQuantity) => {
    try {
      const response = await fetch(`${API_URL}/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity, storeId: selectedStore })
      });

      if (response.ok) {
        const updatedInventory = { ...inventory };
        updatedInventory[selectedStore] = updatedInventory[selectedStore].map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        setInventory(updatedInventory);
      }
    } catch (err) {
      console.error('Error updating inventory:', err);
    }
  };

  const { subtotal, discount, total } = calculateTotal();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (currentView === 'checkout') {
    return (
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>🌙 MOON STAR POS</h1>
            <p style={styles.subtitle}>Investment Trading Corporation</p>
            <p style={styles.location}>📍 {currentStore?.location}</p>
          </div>
        </div>

        {/* Store Navigation */}
        <div style={styles.storeNav}>
          {stores.map(store => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store.id)}
              style={{
                ...styles.storeBtn,
                backgroundColor: selectedStore === store.id ? '#ffd89b' : 'rgba(255,255,255,0.1)',
                color: selectedStore === store.id ? '#000' : '#fff'
              }}
            >
              {store.icon} {store.name}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={styles.mainContent}>
          {/* Products Grid */}
          <div style={styles.productsSection}>
            <h2 style={styles.sectionTitle}>📦 Available Items</h2>
            <div style={styles.productsGrid}>
              {currentInventory.map(item => (
                <div 
                  key={item.id}
                  style={{
                    ...styles.productCard,
                    opacity: item.quantity === 0 ? 0.5 : 1
                  }}
                >
                  <div style={styles.productIcon}>{item.icon}</div>
                  <h3 style={styles.productName}>{item.name}</h3>
                  <p style={styles.productPrice}>PKR {item.price}</p>
                  <p style={styles.productStock}>Stock: {item.quantity}</p>
                  <button
                    onClick={() => addToCart(item)}
                    disabled={item.quantity === 0}
                    style={{
                      ...styles.addBtn,
                      opacity: item.quantity === 0 ? 0.5 : 1
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div style={styles.cartSidebar}>
            <h2 style={styles.cartTitle}>🛒 Cart ({cart.length})</h2>

            {cart.length === 0 ? (
              <p style={styles.emptyCart}>Your cart is empty</p>
            ) : (
              <>
                <div style={styles.cartItems}>
                  {cart.map(item => (
                    <div key={item.id} style={styles.cartItem}>
                      <div>
                        <p style={styles.cartItemName}>{item.name}</p>
                        <p style={styles.cartItemPrice}>PKR {item.price} × {item.quantity}</p>
                      </div>
                      <div style={styles.quantityControls}>
                        <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>−</button>
                        <span style={styles.qtyDisplay}>{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>+</button>
                        <button onClick={() => removeFromCart(item.id)} style={styles.removeBtn}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.discountBox}>
                  <label style={styles.discountLabel}>Discount %</label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    style={styles.discountInput}
                    min="0"
                    max="100"
                  />
                </div>

                <div style={styles.totalsBox}>
                  <div style={styles.totalRow}>
                    <span>Subtotal:</span>
                    <span>PKR {subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div style={styles.discountRow}>
                      <span>Discount ({discountPercent}%):</span>
                      <span>-PKR {discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={styles.totalFinalRow}>
                    <span>Total:</span>
                    <span>PKR {total.toFixed(2)}</span>
                  </div>
                </div>

                <button onClick={completeSale} style={styles.completeBtn}>
                  ✓ Complete Sale
                </button>
              </>
            )}

            <button onClick={() => setCurrentView('inventory')} style={styles.navBtn}>
              📦 Inventory
            </button>
            <button onClick={() => setCurrentView('reports')} style={styles.navBtn}>
              📊 Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'inventory') {
    return (
      <div style={styles.container}>
        <button onClick={() => setCurrentView('checkout')} style={styles.backBtn}>
          ← Back
        </button>
        <h1 style={styles.pageTitle}>📦 Inventory</h1>
        
        <div style={styles.inventoryTable}>
          {currentInventory.map(item => (
            <div key={item.id} style={styles.inventoryRow}>
              <div>
                <p style={styles.itemName}>{item.icon} {item.name}</p>
                <p style={styles.itemPrice}>PKR {item.price}</p>
              </div>
              <div style={styles.inventoryControls}>
                <button onClick={() => updateInventory(item.id, Math.max(0, item.quantity - 1))} style={styles.minusBtn}>−</button>
                <span style={styles.qtyDisplay}>{item.quantity}</span>
                <button onClick={() => updateInventory(item.id, item.quantity + 1)} style={styles.plusBtn}>+</button>
              </div>
              <p style={styles.totalValue}>PKR {(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p>Total Items</p>
            <p style={styles.statNumber}>{currentInventory.reduce((sum, item) => sum + item.quantity, 0)}</p>
          </div>
          <div style={styles.statCard}>
            <p>SKUs</p>
            <p style={styles.statNumber}>{currentInventory.length}</p>
          </div>
          <div style={styles.statCard}>
            <p>Total Value</p>
            <p style={styles.statNumber}>PKR {currentInventory.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'reports') {
    const storeSales = sales.filter(s => s.storeId === selectedStore);
    const totalRevenue = storeSales.reduce((sum, s) => sum + s.total, 0);

    return (
      <div style={styles.container}>
        <button onClick={() => setCurrentView('checkout')} style={styles.backBtn}>
          ← Back
        </button>
        <h1 style={styles.pageTitle}>📊 Sales Report</h1>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p>Store Revenue</p>
            <p style={styles.statNumber}>PKR {totalRevenue.toFixed(2)}</p>
          </div>
          <div style={styles.statCard}>
            <p>Transactions</p>
            <p style={styles.statNumber}>{storeSales.length}</p>
          </div>
          <div style={styles.statCard}>
            <p>Avg Transaction</p>
            <p style={styles.statNumber}>PKR {storeSales.length > 0 ? (totalRevenue / storeSales.length).toFixed(2) : '0'}</p>
          </div>
        </div>

        <h3 style={styles.subTitle}>Recent Transactions</h3>
        <div style={styles.transactionsList}>
          {storeSales.length === 0 ? (
            <p style={styles.noData}>No sales yet</p>
          ) : (
            [...storeSales].reverse().map((sale, idx) => (
              <div key={sale._id} style={styles.transactionItem}>
                <div>
                  <p style={styles.transactionTime}>🕐 {new Date(sale.createdAt).toLocaleString()}</p>
                  <p style={styles.transactionItems}>Items: {sale.items.reduce((sum, i) => sum + i.quantity, 0)}</p>
                </div>
                <p style={styles.transactionTotal}>PKR {sale.total.toFixed(2)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
}

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '12px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255,255,255,0.3)',
    borderTop: '4px solid #ffd89b',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px 12px',
    borderBottom: '3px solid #ffd89b',
    marginBottom: '16px',
    borderRadius: '12px'
  },
  headerContent: {
    textAlign: 'center'
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    margin: '0',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
  },
  subtitle: {
    color: '#e0e0e0',
    margin: '4px 0 0 0',
    fontSize: '12px'
  },
  location: {
    color: '#e0e0e0',
    margin: '4px 0 0 0',
    fontSize: '12px'
  },
  storeNav: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    marginBottom: '16px',
    paddingBottom: '8px'
  },
  storeBtn: {
    padding: '10px 16px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    transition: 'all 0.3s ease'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px'
  },
  productsSection: {
    width: '100%'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 12px 0'
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '16px'
  },
  productCard: {
    background: 'rgba(255,255,255,0.1)',
    padding: '12px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '2px solid rgba(255,255,255,0.2)',
    transition: 'all 0.3s ease'
  },
  productIcon: {
    fontSize: '28px',
    marginBottom: '8px'
  },
  productName: {
    fontWeight: '600',
    margin: '0 0 4px 0',
    fontSize: '14px'
  },
  productPrice: {
    color: '#ffd89b',
    fontWeight: '800',
    margin: '4px 0',
    fontSize: '14px'
  },
  productStock: {
    fontSize: '12px',
    color: '#e0e0e0',
    margin: '4px 0'
  },
  addBtn: {
    width: '100%',
    padding: '8px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#ffd89b',
    color: '#000',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px'
  },
  cartSidebar: {
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '16px',
    border: '2px solid rgba(255,255,255,0.2)',
    maxHeight: '600px',
    overflowY: 'auto'
  },
  cartTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: '0 0 12px 0'
  },
  emptyCart: {
    textAlign: 'center',
    color: '#aaa',
    padding: '20px 0'
  },
  cartItems: {
    marginBottom: '12px'
  },
  cartItem: {
    background: 'rgba(0,0,0,0.2)',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '8px',
    fontSize: '13px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cartItemName: {
    fontWeight: '600',
    margin: '0',
    fontSize: '13px'
  },
  cartItemPrice: {
    color: '#ffd89b',
    margin: '2px 0 0 0',
    fontSize: '12px'
  },
  quantityControls: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center'
  },
  qtyBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    border: 'none',
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  qtyDisplay: {
    width: '24px',
    textAlign: 'center',
    fontWeight: '700'
  },
  removeBtn: {
    background: 'rgba(255, 107, 107, 0.6)',
    color: 'white',
    border: 'none',
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  discountBox: {
    background: 'rgba(255,216,155,0.2)',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '12px'
  },
  discountLabel: {
    fontSize: '11px',
    color: '#e0e0e0',
    display: 'block',
    marginBottom: '4px'
  },
  discountInput: {
    width: '100%',
    padding: '8px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: '#ffd89b',
    border: '1px solid rgba(255,216,155,0.3)',
    borderRadius: '6px',
    fontWeight: '700'
  },
  totalsBox: {
    background: 'rgba(255,216,155,0.2)',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '12px'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px'
  },
  discountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    color: '#ffaaaa'
  },
  totalFinalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid rgba(255,216,155,0.5)',
    paddingTop: '8px',
    fontSize: '14px',
    fontWeight: '800',
    color: '#ffd89b'
  },
  completeBtn: {
    width: '100%',
    padding: '12px',
    background: '#ffd89b',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '800',
    cursor: 'pointer',
    marginBottom: '8px'
  },
  navBtn: {
    width: '100%',
    padding: '10px',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '6px'
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    border: '2px solid #ffd89b',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '16px'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '800',
    margin: '0 0 16px 0'
  },
  inventoryTable: {
    marginBottom: '16px'
  },
  inventoryRow: {
    background: 'rgba(255,255,255,0.1)',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '2px solid rgba(255,255,255,0.2)'
  },
  itemName: {
    fontWeight: '600',
    margin: '0',
    fontSize: '14px'
  },
  itemPrice: {
    color: '#ffd89b',
    margin: '4px 0 0 0',
    fontSize: '12px'
  },
  inventoryControls: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center'
  },
  minusBtn: {
    background: 'rgba(255, 107, 107, 0.6)',
    color: 'white',
    border: 'none',
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  plusBtn: {
    background: 'rgba(76, 175, 80, 0.6)',
    color: 'white',
    border: 'none',
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  totalValue: {
    color: '#90EE90',
    fontWeight: '700',
    margin: '0',
    fontSize: '13px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px'
  },
  statCard: {
    background: 'rgba(255,255,255,0.1)',
    padding: '14px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '2px solid rgba(255,255,255,0.2)'
  },
  statNumber: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffd89b',
    margin: '8px 0 0 0'
  },
  subTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: '16px 0 12px 0'
  },
  transactionsList: {
    marginBottom: '16px'
  },
  transactionItem: {
    background: 'rgba(255,255,255,0.1)',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    border: '2px solid rgba(255,255,255,0.2)'
  },
  transactionTime: {
    margin: '0',
    fontWeight: '600',
    fontSize: '13px'
  },
  transactionItems: {
    color: '#e0e0e0',
    margin: '4px 0 0 0',
    fontSize: '12px'
  },
  transactionTotal: {
    color: '#90EE90',
    fontWeight: '800',
    margin: '0',
    fontSize: '14px'
  },
  noData: {
    textAlign: 'center',
    color: '#aaa',
    padding: '20px 0'
  }
};
