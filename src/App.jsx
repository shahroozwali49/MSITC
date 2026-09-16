import React, { useEffect, useMemo, useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  Package,
  BarChart3,
  ShoppingCart,
  Home,
  Store,
  Receipt,
  Wallet,
  TrendingUp,
  Boxes,
  RotateCcw,
} from 'lucide-react';

const INITIAL_STORES = [
  { id: 1, name: 'Downtown', location: 'Downtown Branch', icon: '🏢' },
  { id: 2, name: 'Mall', location: 'Shopping Mall', icon: '🛍️' },
  { id: 3, name: 'Market', location: 'Central Market', icon: '🏪' },
  { id: 4, name: 'Plaza', location: 'Business Plaza', icon: '🏬' },
  { id: 5, name: 'Center', location: 'City Center', icon: '🌆' },
  { id: 6, name: 'Suburbs', location: 'Suburban Area', icon: '🏘️' },
];

const PRODUCTS = [
  { id: 1, name: 'T-Shirt', price: 5, icon: '👕' },
  { id: 2, name: 'Jeans', price: 15, icon: '👖' },
  { id: 3, name: 'Jacket', price: 25, icon: '🧥' },
  { id: 4, name: 'Shoes', price: 20, icon: '👞' },
  { id: 5, name: 'Sweater', price: 18, icon: '🧶' },
];

const INITIAL_QUANTITIES = {
  1: [150, 85, 40, 60, 90],
  2: [120, 70, 35, 55, 80],
  3: [180, 95, 50, 70, 100],
  4: [140, 75, 45, 65, 85],
  5: [160, 80, 42, 58, 92],
  6: [130, 68, 38, 50, 75],
};

function createInitialInventory() {
  const inventory = {};

  Object.keys(INITIAL_QUANTITIES).forEach((storeId) => {
    inventory[storeId] = PRODUCTS.map((product, index) => ({
      ...product,
      quantity: INITIAL_QUANTITIES[storeId][index],
    }));
  });

  return inventory;
}

const currency = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function App() {
  const [currentView, setCurrentView] = useState('checkout');
  const [stores] = useState(INITIAL_STORES);
  const [selectedStore, setSelectedStore] = useState(1);
  const [inventory, setInventory] = useState(createInitialInventory);
  const [sales, setSales] = useState([]);
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);

  /*
   * Load saved application data.
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('moonstar_data');

      if (!saved) return;

      const data = JSON.parse(saved);

      if (data.inventory) {
        setInventory(data.inventory);
      }

      if (Array.isArray(data.sales)) {
        setSales(data.sales);
      }
    } catch (error) {
      console.error('Unable to load saved POS data:', error);
    }
  }, []);

  /*
   * Save inventory and sales.
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        'moonstar_data',
        JSON.stringify({
          inventory,
          sales,
        })
      );
    } catch (error) {
      console.error('Unable to save POS data:', error);
    }
  }, [inventory, sales]);

  const currentStore = stores.find((store) => store.id === selectedStore);

  const currentInventory = inventory[selectedStore] || [];

  /*
   * Only show cart items belonging to the currently selected store.
   * This prevents products from different stores being mixed together.
   */
  const currentStoreCart = cart.filter(
    (item) => item.storeId === selectedStore
  );

  const totals = useMemo(() => {
    const subtotal = currentStoreCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const discount = subtotal * (discountPercent / 100);

    return {
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
    };
  }, [currentStoreCart, discountPercent]);

  /*
   * Find available inventory quantity for a product.
   */
  const getAvailableQuantity = (productId) => {
    const inventoryItem = currentInventory.find(
      (item) => item.id === productId
    );

    if (!inventoryItem) return 0;

    const cartItem = currentStoreCart.find(
      (item) => item.id === productId
    );

    const cartQuantity = cartItem ? cartItem.quantity : 0;

    return Math.max(0, inventoryItem.quantity - cartQuantity);
  };

  /*
   * Add product to cart.
   */
  const addToCart = (item) => {
    const availableQuantity = getAvailableQuantity(item.id);

    if (availableQuantity <= 0) {
      return;
    }

    const existingItem = cart.find(
      (cartItem) =>
        cartItem.id === item.id &&
        cartItem.storeId === selectedStore
    );

    if (existingItem) {
      setCart((previousCart) =>
        previousCart.map((cartItem) =>
          cartItem.id === item.id &&
          cartItem.storeId === selectedStore
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        )
      );
    } else {
      setCart((previousCart) => [
        ...previousCart,
        {
          ...item,
          quantity: 1,
          storeId: selectedStore,
        },
      ]);
    }
  };

  /*
   * Remove product completely from cart.
   */
  const removeFromCart = (itemId, storeId = selectedStore) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) => !(item.id === itemId && item.storeId === storeId)
      )
    );
  };

  /*
   * Safely update cart quantity.
   */
  const updateCartQuantity = (itemId, newQuantity) => {
    const inventoryItem = currentInventory.find(
      (item) => item.id === itemId
    );

    if (!inventoryItem) return;

    const safeQuantity = Math.min(
      Math.max(0, Number(newQuantity)),
      inventoryItem.quantity
    );

    if (safeQuantity === 0) {
      removeFromCart(itemId);
      return;
    }

    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === itemId && item.storeId === selectedStore
          ? {
              ...item,
              quantity: safeQuantity,
            }
          : item
      )
    );
  };

  /*
   * Complete current sale.
   */
  const completeSale = () => {
    if (currentStoreCart.length === 0) {
      alert('Please add at least one item to the cart.');
      return;
    }

    const { subtotal, discount, total } = totals;

    /*
     * Validate inventory one more time before completing the sale.
     */
    const invalidItem = currentStoreCart.find((cartItem) => {
      const inventoryItem = currentInventory.find(
        (item) => item.id === cartItem.id
      );

      return (
        !inventoryItem ||
        cartItem.quantity > inventoryItem.quantity
      );
    });

    if (invalidItem) {
      alert(
        `Insufficient stock for ${invalidItem.name}. Please adjust the cart.`
      );
      return;
    }

    const saleRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      displayTimestamp: new Date().toLocaleString('en-PK'),
      storeId: selectedStore,
      items: currentStoreCart.map((item) => ({ ...item })),
      subtotal,
      discount,
      total,
      discountPercent,
    };

    /*
     * Save sale.
     */
    setSales((previousSales) => [
      ...previousSales,
      saleRecord,
    ]);

    /*
     * Deduct inventory.
     */
    setInventory((previousInventory) => {
      const storeInventory = previousInventory[selectedStore] || [];

      return {
        ...previousInventory,
        [selectedStore]: storeInventory.map((inventoryItem) => {
          const soldItem = currentStoreCart.find(
            (cartItem) => cartItem.id === inventoryItem.id
          );

          if (!soldItem) {
            return inventoryItem;
          }

          return {
            ...inventoryItem,
            quantity: Math.max(
              0,
              inventoryItem.quantity - soldItem.quantity
            ),
          };
        }),
      };
    });

    /*
     * Remove only this store's items from the cart.
     */
    setCart((previousCart) =>
      previousCart.filter(
        (item) => item.storeId !== selectedStore
      )
    );

    setDiscountPercent(0);

    alert(
      `Sale Completed!\n\nTotal: ${currency(
        total
      )}\n\nThank you!`
    );
  };

  /*
   * Change store.
   *
   * We intentionally do not delete another store's cart.
   * This means switching stores will not accidentally lose a cart.
   */
  const changeStore = (storeId) => {
    setSelectedStore(storeId);
    setDiscountPercent(0);
  };

  /*
   * Reset demo data.
   */
  const resetData = () => {
    const confirmed = window.confirm(
      'Reset all inventory and sales data? This cannot be undone.'
    );

    if (!confirmed) return;

    const freshInventory = createInitialInventory();

    setInventory(freshInventory);
    setSales([]);
    setCart([]);
    setDiscountPercent(0);

    localStorage.removeItem('moonstar_data');
  };

  /*
   * Change inventory quantity.
   */
  const adjustInventory = (itemId, amount) => {
    setInventory((previousInventory) => {
      const storeInventory =
        previousInventory[selectedStore] || [];

      return {
        ...previousInventory,
        [selectedStore]: storeInventory.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: Math.max(
                  0,
                  item.quantity + amount
                ),
              }
            : item
        ),
      };
    });

    /*
     * If stock is reduced below cart quantity,
     * reduce the cart quantity as well.
     */
    if (amount < 0) {
      setCart((previousCart) =>
        previousCart.map((cartItem) => {
          if (
            cartItem.storeId !== selectedStore ||
            cartItem.id !== itemId
          ) {
            return cartItem;
          }

          const inventoryItem = currentInventory.find(
            (item) => item.id === itemId
          );

          const newStock = Math.max(
            0,
            (inventoryItem?.quantity || 0) + amount
          );

          return {
            ...cartItem,
            quantity: Math.min(cartItem.quantity, newStock),
          };
        }).filter((item) => item.quantity > 0)
      );
    }
  };

  /*
   * -------------------------
   * CHECKOUT VIEW
   * -------------------------
   */
  if (currentView === 'checkout') {
    return (
      <div style={styles.app}>
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <div style={styles.brandArea}>
              <div style={styles.logo}>
                🌙
              </div>

              <div>
                <h1 style={styles.brandTitle}>
                  MOON STAR POS
                </h1>

                <p style={styles.brandSubtitle}>
                  Investment Trading Corporation
                </p>
              </div>
            </div>

            <div style={styles.headerInfo}>
              <div style={styles.headerInfoRow}>
                <Store size={16} />
                <span>{currentStore?.location}</span>
              </div>

              <div style={styles.headerInfoRow}>
                <span>
                  {new Date().toLocaleDateString('en-PK')}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.storeNavigation}>
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => changeStore(store.id)}
                style={{
                  ...styles.storeButton,
                  ...(selectedStore === store.id
                    ? styles.storeButtonActive
                    : {}),
                }}
              >
                <span>{store.icon}</span>
                {store.name}
              </button>
            ))}
          </div>
        </header>

        <main style={styles.main}>
          <section>
            <div style={styles.sectionHeading}>
              <div>
                <h2 style={styles.sectionTitle}>
                  <Package size={22} />
                  Available Items
                </h2>

                <p style={styles.sectionSubtitle}>
                  Select products to add them to the cart
                </p>
              </div>

              <div style={styles.storeBadge}>
                {currentStore?.icon} {currentStore?.name}
              </div>
            </div>

            <div style={styles.productGrid}>
              {currentInventory.map((item) => {
                const available = getAvailableQuantity(item.id);
                const outOfStock = available <= 0;

                return (
                  <div
                    key={item.id}
                    style={{
                      ...styles.productCard,
                      ...(outOfStock
                        ? styles.productCardDisabled
                        : {}),
                    }}
                  >
                    <div style={styles.productIcon}>
                      {item.icon}
                    </div>

                    <h3 style={styles.productName}>
                      {item.name}
                    </h3>

                    <div style={styles.productPrice}>
                      {currency(item.price)}
                    </div>

                    <div style={styles.stockRow}>
                      <span style={styles.stockText}>
                        Stock: {item.quantity}
                      </span>

                      <span
                        style={{
                          ...styles.stockStatus,
                          ...(item.quantity <= 50
                            ? styles.lowStock
                            : styles.inStock),
                        }}
                      >
                        {item.quantity <= 50
                          ? 'Low Stock'
                          : 'In Stock'}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(item)}
                      disabled={outOfStock}
                      style={{
                        ...styles.addButton,
                        ...(outOfStock
                          ? styles.addButtonDisabled
                          : {}),
                      }}
                    >
                      <Plus size={16} />
                      {outOfStock
                        ? 'Out of Stock'
                        : 'Add to Cart'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <aside style={styles.cartPanel}>
            <div style={styles.cartHeader}>
              <div>
                <h2 style={styles.cartTitle}>
                  <ShoppingCart size={21} />
                  Current Cart
                </h2>

                <p style={styles.cartSubtitle}>
                  {currentStore?.name} Store
                </p>
              </div>

              <span style={styles.cartCount}>
                {currentStoreCart.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )}
              </span>
            </div>

            {currentStoreCart.length === 0 ? (
              <div style={styles.emptyCart}>
                <ShoppingCart
                  size={52}
                  strokeWidth={1.5}
                />

                <h3>Your cart is empty</h3>

                <p>
                  Add products from the available items.
                </p>
              </div>
            ) : (
              <>
                <div style={styles.cartItems}>
                  {currentStoreCart.map((item) => {
                    const inventoryItem = currentInventory.find(
                      (inventoryProduct) =>
                        inventoryProduct.id === item.id
                    );

                    const maxQuantity =
                      inventoryItem?.quantity || 0;

                    return (
                      <div
                        key={`${item.storeId}-${item.id}`}
                        style={styles.cartItem}
                      >
                        <div style={styles.cartItemTop}>
                          <div style={styles.cartItemInfo}>
                            <span style={styles.cartItemIcon}>
                              {item.icon}
                            </span>

                            <div>
                              <strong>
                                {item.name}
                              </strong>

                              <small>
                                {currency(item.price)} each
                              </small>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              removeFromCart(item.id)
                            }
                            style={styles.removeButton}
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div style={styles.quantityRow}>
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.id,
                                item.quantity - 1
                              )
                            }
                            style={styles.quantityButton}
                          >
                            <Minus size={14} />
                          </button>

                          <span style={styles.quantityValue}>
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.id,
                                Math.min(
                                  item.quantity + 1,
                                  maxQuantity
                                )
                              )
                            }
                            disabled={
                              item.quantity >= maxQuantity
                            }
                            style={{
                              ...styles.quantityButton,
                              ...(item.quantity >=
                              maxQuantity
                                ? styles.disabledButton
                                : {}),
                            }}
                          >
                            <Plus size={14} />
                          </button>

                          <strong style={styles.itemTotal}>
                            {currency(
                              item.price * item.quantity
                            )}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={styles.discountBox}>
                  <label style={styles.inputLabel}>
                    Discount %
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={discountPercent}
                    onChange={(event) => {
                      const value = Number(
                        event.target.value
                      );

                      setDiscountPercent(
                        Math.min(
                          100,
                          Math.max(
                            0,
                            Number.isFinite(value)
                              ? value
                              : 0
                          )
                        )
                      );
                    }}
                    style={styles.discountInput}
                  />
                </div>

                <div style={styles.totalsBox}>
                  <div style={styles.totalRow}>
                    <span>Subtotal</span>
                    <strong>
                      {currency(totals.subtotal)}
                    </strong>
                  </div>

                  {totals.discount > 0 && (
                    <div
                      style={{
                        ...styles.totalRow,
                        color: '#dc2626',
                      }}
                    >
                      <span>
                        Discount ({discountPercent}%)
                      </span>

                      <strong>
                        -{currency(totals.discount)}
                      </strong>
                    </div>
                  )}

                  <div style={styles.grandTotal}>
                    <span>Total</span>
                    <strong>
                      {currency(totals.total)}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={completeSale}
                  style={styles.completeButton}
                >
                  <Receipt size={18} />
                  Complete Sale
                </button>
              </>
            )}

            <div style={styles.navigationButtons}>
              <button
                onClick={() => setCurrentView('inventory')}
                style={styles.secondaryButton}
              >
                <Boxes size={17} />
                Inventory
              </button>

              <button
                onClick={() => setCurrentView('reports')}
                style={styles.secondaryButton}
              >
                <BarChart3 size={17} />
                Reports
              </button>
            </div>
          </aside>
        </main>
      </div>
    );
  }

  /*
   * -------------------------
   * INVENTORY VIEW
   * -------------------------
   */
  if (currentView === 'inventory') {
    const totalUnits = currentInventory.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const totalValue = currentInventory.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return (
      <div style={styles.page}>
        <div style={styles.pageContainer}>
          <div style={styles.pageTopBar}>
            <button
              onClick={() => setCurrentView('checkout')}
              style={styles.backButton}
            >
              <Home size={17} />
              Back to Checkout
            </button>

            <button
              onClick={resetData}
              style={styles.resetButton}
            >
              <RotateCcw size={16} />
              Reset Demo Data
            </button>
          </div>

          <div style={styles.pageTitleArea}>
            <div>
              <h1 style={styles.pageTitle}>
                <Package size={29} />
                Inventory Management
              </h1>

              <p style={styles.pageSubtitle}>
                {currentStore?.icon} {currentStore?.location}
              </p>
            </div>
          </div>

          <div style={styles.inventoryStoreBar}>
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => changeStore(store.id)}
                style={{
                  ...styles.inventoryStoreButton,
                  ...(selectedStore === store.id
                    ? styles.inventoryStoreButtonActive
                    : {}),
                }}
              >
                {store.icon} {store.name}
              </button>
            ))}
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Boxes size={22} />
              </div>

              <div>
                <span style={styles.statLabel}>
                  Total Units
                </span>

                <strong style={styles.statValue}>
                  {totalUnits.toLocaleString()}
                </strong>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Package size={22} />
              </div>

              <div>
                <span style={styles.statLabel}>
                  Products / SKUs
                </span>

                <strong style={styles.statValue}>
                  {currentInventory.length}
                </strong>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Wallet size={22} />
              </div>

              <div>
                <span style={styles.statLabel}>
                  Inventory Value
                </span>

                <strong style={styles.statValue}>
                  {currency(totalValue)}
                </strong>
              </div>
            </div>
          </div>

          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2>Stock Overview</h2>
              <span>
                {currentStore?.name} Store
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product</th>
                    <th style={styles.thRight}>
                      Unit Price
                    </th>
                    <th style={styles.thRight}>
                      Quantity
                    </th>
                    <th style={styles.thRight}>
                      Total Value
                    </th>
                    <th style={styles.thCenter}>
                      Adjust
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {currentInventory.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.td}>
                        <div style={styles.tableProduct}>
                          <span>
                            {item.icon}
                          </span>

                          <strong>
                            {item.name}
                          </strong>
                        </div>
                      </td>

                      <td style={styles.tdRight}>
                        {currency(item.price)}
                      </td>

                      <td style={styles.tdRight}>
                        <strong>
                          {item.quantity}
                        </strong>
                      </td>

                      <td style={styles.tdRight}>
                        <strong>
                          {currency(
                            item.price *
                              item.quantity
                          )}
                        </strong>
                      </td>

                      <td style={styles.tdCenter}>
                        <button
                          onClick={() =>
                            adjustInventory(
                              item.id,
                              -1
                            )
                          }
                          style={styles.adjustMinus}
                        >
                          <Minus size={15} />
                        </button>

                        <button
                          onClick={() =>
                            adjustInventory(
                              item.id,
                              1
                            )
                          }
                          style={styles.adjustPlus}
                        >
                          <Plus size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * -------------------------
   * REPORTS VIEW
   * -------------------------
   */
  if (currentView === 'reports') {
    const storeSales = sales.filter(
      (sale) => sale.storeId === selectedStore
    );

    const totalRevenue = storeSales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0
    );

    const totalAllRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0
    );

    const averageTransaction =
      storeSales.length > 0
        ? totalRevenue / storeSales.length
        : 0;

    const totalItemsSold = storeSales.reduce(
      (sum, sale) =>
        sum +
        sale.items.reduce(
          (itemSum, item) =>
            itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );

    return (
      <div style={styles.page}>
        <div style={styles.pageContainer}>
          <div style={styles.pageTopBar}>
            <button
              onClick={() => setCurrentView('checkout')}
              style={styles.backButton}
            >
              <Home size={17} />
              Back to Checkout
            </button>

            <button
              onClick={resetData}
              style={styles.resetButton}
            >
              <RotateCcw size={16} />
              Reset Demo Data
            </button>
          </div>

          <div style={styles.pageTitleArea}>
            <div>
              <h1 style={styles.pageTitle}>
                <BarChart3 size={29} />
                Sales Analytics
              </h1>

              <p style={styles.pageSubtitle}>
                Track sales performance across all stores
              </p>
            </div>
          </div>

          <div style={styles.inventoryStoreBar}>
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => changeStore(store.id)}
                style={{
                  ...styles.inventoryStoreButton,
                  ...(selectedStore === store.id
                    ? styles.inventoryStoreButtonActive
                    : {}),
                }}
              >
                {store.icon} {store.name}
              </button>
            ))}
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <TrendingUp size={22} />
              </div>

              <div>
                <span style={styles.statLabel}>
                  Store Revenue
                </span>

                <strong style={styles.statValue}>
                  {currency(totalRevenue)}
                </strong>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Wallet size={22} />
              </div>

              <div>
                <span style={styles.statLabel}>
                  All Stores Revenue
                </span>

                <strong style={styles.statValue}>
                  {currency(totalAllRevenue)}
                </strong>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Receipt size={22} />
              </div>

              <div>
                <span style={styles.statLabel}>
                  Average Transaction
                </span>

                <strong style={styles.statValue}>
                  {currency(averageTransaction)}
                </strong>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <ShoppingCart size={22} />
              </div>

              <div>
                <span style={styles.statLabel}>
                  Items Sold
                </span>

                <strong style={styles.statValue}>
                  {totalItemsSold}
                </strong>
              </div>
            </div>
          </div>

          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2>Store Comparison</h2>
              <span>
                {sales.length} total transactions
              </span>
            </div>

            <div style={styles.storeComparisonGrid}>
              {stores.map((store) => {
                const storeTransactions =
                  sales.filter(
                    (sale) =>
                      sale.storeId === store.id
                  );

                const revenue =
                  storeTransactions.reduce(
                    (sum, sale) =>
                      sum +
                      Number(sale.total || 0),
                    0
                  );

                return (
                  <div
                    key={store.id}
                    onClick={() =>
                      changeStore(store.id)
                    }
                    style={{
                      ...styles.comparisonCard,
                      ...(selectedStore === store.id
                        ? styles.comparisonCardActive
                        : {}),
                    }}
                  >
                    <div style={styles.comparisonIcon}>
                      {store.icon}
                    </div>

                    <div>
                      <strong>
                        {store.name}
                      </strong>

                      <p>
                        {storeTransactions.length}{' '}
                        transaction
                        {storeTransactions.length ===
                        1
                          ? ''
                          : 's'}
                      </p>

                      <b>
                        {currency(revenue)}
                      </b>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2>
                Recent Transactions
              </h2>

              <span>
                {currentStore?.name}
              </span>
            </div>

            {storeSales.length === 0 ? (
              <div style={styles.emptyReports}>
                <Receipt
                  size={48}
                  strokeWidth={1.5}
                />

                <h3>
                  No sales recorded yet
                </h3>

                <p>
                  Completed transactions for this
                  store will appear here.
                </p>
              </div>
            ) : (
              <div>
                {[...storeSales]
                  .reverse()
                  .map((sale) => (
                    <div
                      key={sale.id}
                      style={styles.transaction}
                    >
                      <div>
                        <strong>
                          Sale #
                          {String(sale.id).slice(
                            -6
                          )}
                        </strong>

                        <p>
                          {sale.displayTimestamp ||
                            new Date(
                              sale.timestamp
                            ).toLocaleString(
                              'en-PK'
                            )}
                        </p>

                        <small>
                          {sale.items.reduce(
                            (sum, item) =>
                              sum +
                              item.quantity,
                            0
                          )}{' '}
                          items
                        </small>
                      </div>

                      <div style={styles.transactionRight}>
                        <strong>
                          {currency(sale.total)}
                        </strong>

                        {sale.discountPercent >
                          0 && (
                          <small>
                            Discount:{' '}
                            {
                              sale.discountPercent
                            }
                            %
                          </small>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/*
 * ----------------------------------------------------
 * STYLES
 * ----------------------------------------------------
 */

const styles = {
  app: {
    minHeight: '100vh',
    background: '#f4f7fb',
    color: '#172033',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  header: {
    background:
      'linear-gradient(135deg, #111827 0%, #172554 55%, #1e3a8a 100%)',
    color: '#fff',
    padding: '22px 28px 18px',
    boxShadow:
      '0 10px 30px rgba(15, 23, 42, 0.18)',
  },

  headerInner: {
    maxWidth: '1450px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
  },

  brandArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },

  logo: {
    width: '52px',
    height: '52px',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '27px',
    background:
      'linear-gradient(135deg, #f8fafc, #dbeafe)',
    boxShadow:
      '0 8px 20px rgba(0,0,0,0.2)',
  },

  brandTitle: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 850,
    letterSpacing: '-0.6px',
  },

  brandSubtitle: {
    margin: '4px 0 0',
    color: '#cbd5e1',
    fontSize: '12px',
  },

  headerInfo: {
    textAlign: 'right',
    color: '#cbd5e1',
    fontSize: '12px',
  },

  headerInfoRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '7px',
    marginBottom: '5px',
  },

  storeNavigation: {
    maxWidth: '1450px',
    margin: '20px auto 0',
    display: 'flex',
    gap: '9px',
    overflowX: 'auto',
    paddingBottom: '2px',
  },

  storeButton: {
    border: '1px solid rgba(255,255,255,0.13)',
    background: 'rgba(255,255,255,0.07)',
    color: '#dbeafe',
    padding: '10px 15px',
    borderRadius: '10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontWeight: 650,
    fontSize: '13px',
  },

  storeButtonActive: {
    background: '#fff',
    color: '#172033',
    borderColor: '#fff',
    boxShadow:
      '0 5px 18px rgba(0,0,0,0.18)',
  },

  main: {
    maxWidth: '1450px',
    margin: '0 auto',
    padding: '28px',
    display: 'grid',
    gridTemplateColumns:
      'minmax(0, 1fr) 390px',
    gap: '25px',
    alignItems: 'start',
  },

  sectionHeading: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '18px',
  },

  sectionTitle: {
    margin: 0,
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    letterSpacing: '-0.3px',
  },

  sectionSubtitle: {
    margin: '5px 0 0',
    color: '#718096',
    fontSize: '13px',
  },

  storeBadge: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    padding: '8px 12px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
  },

  productGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fill, minmax(165px, 1fr))',
    gap: '15px',
  },

  productCard: {
    background: '#fff',
    border: '1px solid #e5eaf1',
    borderRadius: '16px',
    padding: '17px',
    boxShadow:
      '0 5px 18px rgba(15, 23, 42, 0.055)',
    transition:
      'transform 0.2s ease, box-shadow 0.2s ease',
  },

  productCardDisabled: {
    opacity: 0.55,
  },

  productIcon: {
    width: '58px',
    height: '58px',
    margin: '0 auto 12px',
    borderRadius: '15px',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '31px',
  },

  productName: {
    textAlign: 'center',
    margin: 0,
    fontSize: '15px',
  },

  productPrice: {
    textAlign: 'center',
    marginTop: '6px',
    color: '#1d4ed8',
    fontSize: '17px',
    fontWeight: 850,
  },

  stockRow: {
    marginTop: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '5px',
  },

  stockText: {
    color: '#64748b',
    fontSize: '11px',
  },

  stockStatus: {
    padding: '4px 7px',
    borderRadius: '999px',
    fontSize: '9px',
    fontWeight: 800,
  },

  inStock: {
    background: '#dcfce7',
    color: '#166534',
  },

  lowStock: {
    background: '#fef3c7',
    color: '#92400e',
  },

  addButton: {
    width: '100%',
    marginTop: '13px',
    padding: '10px',
    border: 'none',
    borderRadius: '10px',
    background: '#172554',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontWeight: 750,
    fontSize: '12px',
  },

  addButtonDisabled: {
    background: '#cbd5e1',
    cursor: 'not-allowed',
  },

  cartPanel: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '20px',
    position: 'sticky',
    top: '18px',
    boxShadow:
      '0 8px 28px rgba(15, 23, 42, 0.08)',
  },

  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },

  cartTitle: {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '18px',
  },

  cartSubtitle: {
    margin: '4px 0 0',
    color: '#94a3b8',
    fontSize: '11px',
  },

  cartCount: {
    width: '29px',
    height: '29px',
    borderRadius: '50%',
    background: '#172554',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '12px',
  },

  emptyCart: {
    textAlign: 'center',
    padding: '45px 15px',
    color: '#94a3b8',
  },

  cartItems: {
    maxHeight: '370px',
    overflowY: 'auto',
    paddingRight: '3px',
  },

  cartItem: {
    padding: '12px',
    border: '1px solid #edf1f5',
    borderRadius: '12px',
    marginBottom: '9px',
    background: '#fafbfc',
  },

  cartItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  cartItemInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
  },

  cartItemIcon: {
    fontSize: '22px',
  },

  cartItemInfoStrong: {
    display: 'block',
  },

  removeButton: {
    width: '27px',
    height: '27px',
    border: 'none',
    borderRadius: '7px',
    background: '#fee2e2',
    color: '#b91c1c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  quantityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '10px',
  },

  quantityButton: {
    width: '29px',
    height: '29px',
    border: '1px solid #dbe2ea',
    background: '#fff',
    borderRadius: '7px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  disabledButton: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },

  quantityValue: {
    width: '32px',
    textAlign: 'center',
    fontWeight: 800,
    fontSize: '13px',
  },

  itemTotal: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#1e3a8a',
  },

  discountBox: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #e2e8f0',
  },

  inputLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 700,
    marginBottom: '6px',
  },

  discountInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #dbe2ea',
    borderRadius: '9px',
    outline: 'none',
    fontSize: '14px',
    fontWeight: 700,
    boxSizing: 'border-box',
  },

  totalsBox: {
    marginTop: '15px',
    padding: '14px',
    background: '#f8fafc',
    borderRadius: '11px',
  },

  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    marginBottom: '9px',
  },

  grandTotal: {
    borderTop: '1px solid #dbe2ea',
    paddingTop: '11px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '18px',
    fontWeight: 850,
    color: '#172554',
  },

  completeButton: {
    width: '100%',
    marginTop: '14px',
    padding: '13px',
    border: 'none',
    borderRadius: '10px',
    background: '#172554',
    color: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 800,
  },

  navigationButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '10px',
  },

  secondaryButton: {
    border: '1px solid #dbe2ea',
    background: '#fff',
    color: '#334155',
    padding: '10px',
    borderRadius: '9px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 700,
    fontSize: '11px',
  },

  page: {
    minHeight: '100vh',
    background: '#f4f7fb',
    color: '#172033',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '25px',
  },

  pageContainer: {
    maxWidth: '1250px',
    margin: '0 auto',
  },

  pageTopBar: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '25px',
  },

  backButton: {
    border: 'none',
    background: '#172554',
    color: '#fff',
    padding: '10px 15px',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    cursor: 'pointer',
    fontWeight: 700,
  },

  resetButton: {
    border: '1px solid #fecaca',
    background: '#fff',
    color: '#b91c1c',
    padding: '10px 15px',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    cursor: 'pointer',
    fontWeight: 700,
  },

  pageTitleArea: {
    marginBottom: '20px',
  },

  pageTitle: {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '27px',
    letterSpacing: '-0.5px',
  },

  pageSubtitle: {
    color: '#718096',
    margin: '7px 0 0',
    fontSize: '13px',
  },

  inventoryStoreBar: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    marginBottom: '20px',
  },

  inventoryStoreButton: {
    border: '1px solid #dbe2ea',
    background: '#fff',
    padding: '9px 13px',
    borderRadius: '9px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontWeight: 650,
    color: '#475569',
  },

  inventoryStoreButtonActive: {
    background: '#172554',
    color: '#fff',
    borderColor: '#172554',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '14px',
    marginBottom: '20px',
  },

  statCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    boxShadow:
      '0 5px 18px rgba(15,23,42,0.04)',
  },

  statIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: '#eff6ff',
    color: '#1d4ed8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statLabel: {
    display: 'block',
    color: '#64748b',
    fontSize: '11px',
    fontWeight: 650,
  },

  statValue: {
    display: 'block',
    marginTop: '4px',
    color: '#172554',
    fontSize: '19px',
  },

  tableCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '15px',
    overflow: 'hidden',
    marginBottom: '20px',
    boxShadow:
      '0 5px 18px rgba(15,23,42,0.04)',
  },

  tableHeader: {
    padding: '16px 18px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },

  tableHeaderH2: {
    margin: 0,
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  th: {
    textAlign: 'left',
    padding: '13px 16px',
    background: '#f8fafc',
    color: '#64748b',
    fontSize: '11px',
    fontWeight: 800,
  },

  thRight: {
    textAlign: 'right',
    padding: '13px 16px',
    background: '#f8fafc',
    color: '#64748b',
    fontSize: '11px',
    fontWeight: 800,
  },

  thCenter: {
    textAlign: 'center',
    padding: '13px 16px',
    background: '#f8fafc',
    color: '#64748b',
    fontSize: '11px',
    fontWeight: 800,
  },

  td: {
    padding: '15px 16px',
    borderTop: '1px solid #edf1f5',
    fontSize: '13px',
  },

  tdRight: {
    padding: '15px 16px',
    borderTop: '1px solid #edf1f5',
    textAlign: 'right',
    fontSize: '13px',
  },

  tdCenter: {
    padding: '15px 16px',
    borderTop: '1px solid #edf1f5',
    textAlign: 'center',
  },

  tableProduct: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  adjustMinus: {
    width: '31px',
    height: '31px',
    border: 'none',
    borderRadius: '7px',
    background: '#fee2e2',
    color: '#b91c1c',
    cursor: 'pointer',
    marginRight: '5px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  adjustPlus: {
    width: '31px',
    height: '31px',
    border: 'none',
    borderRadius: '7px',
    background: '#dcfce7',
    color: '#166534',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  storeComparisonGrid: {
    padding: '17px',
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
  },

  comparisonCard: {
    padding: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '11px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    background: '#fff',
  },

  comparisonCardActive: {
    border: '2px solid #1d4ed8',
    background: '#eff6ff',
  },

  comparisonIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '9px',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },

  emptyReports: {
    textAlign: 'center',
    padding: '55px 20px',
    color: '#94a3b8',
  },

  transaction: {
    padding: '15px 18px',
    borderBottom: '1px solid #edf1f5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
  },

  transactionRight: {
    textAlign: 'right',
  },
};
```

### One package is required

In your project terminal, run:

```bash
npm install lucide-react
```

Then start the project:

```bash
npm run dev
```

### Your files should be

```text
moon-star-pos/
│
├── src/
│   ├── App.jsx          ← replace with the code above
│   ├── main.jsx
│   └── index.css
│
├── public/
│
├── package.json
├── vite.config.js
└── index.html
```

And `src/index.css` can be:

```css
* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
  width: 100%;
}

body {
  margin: 0;
}
