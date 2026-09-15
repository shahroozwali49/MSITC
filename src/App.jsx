import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  DollarSign,
  Package,
  MapPin,
  BarChart3
} from 'lucide-react';

export default function MoonStarPOS() {
  const [currentView, setCurrentView] = useState('checkout');

  const [stores] = useState([
    { id: 1, name: 'Store 1 - Downtown', location: 'Downtown' },
    { id: 2, name: 'Store 2 - Mall', location: 'Shopping Mall' },
    { id: 3, name: 'Store 3 - Market', location: 'Central Market' },
    { id: 4, name: 'Store 4 - Plaza', location: 'Business Plaza' },
    { id: 5, name: 'Store 5 - Center', location: 'City Center' },
    { id: 6, name: 'Store 6 - Suburbs', location: 'Suburban Area' }
  ]);

  const [selectedStore, setSelectedStore] = useState(1);
  const [cart, setCart] = useState([]);

  const [inventory, setInventory] = useState({
    1: [
      { id: 1, name: 'T-Shirt', price: 5, quantity: 150 },
      { id: 2, name: 'Jeans', price: 15, quantity: 85 },
      { id: 3, name: 'Jacket', price: 25, quantity: 40 },
      { id: 4, name: 'Shoes', price: 20, quantity: 60 },
      { id: 5, name: 'Sweater', price: 18, quantity: 90 }
    ],
    2: [
      { id: 1, name: 'T-Shirt', price: 5, quantity: 120 },
      { id: 2, name: 'Jeans', price: 15, quantity: 70 },
      { id: 3, name: 'Jacket', price: 25, quantity: 35 },
      { id: 4, name: 'Shoes', price: 20, quantity: 55 },
      { id: 5, name: 'Sweater', price: 18, quantity: 80 }
    ],
    3: [
      { id: 1, name: 'T-Shirt', price: 5, quantity: 180 },
      { id: 2, name: 'Jeans', price: 15, quantity: 95 },
      { id: 3, name: 'Jacket', price: 25, quantity: 50 },
      { id: 4, name: 'Shoes', price: 20, quantity: 70 },
      { id: 5, name: 'Sweater', price: 18, quantity: 100 }
    ],
    4: [
      { id: 1, name: 'T-Shirt', price: 5, quantity: 140 },
      { id: 2, name: 'Jeans', price: 15, quantity: 75 },
      { id: 3, name: 'Jacket', price: 25, quantity: 45 },
      { id: 4, name: 'Shoes', price: 20, quantity: 65 },
      { id: 5, name: 'Sweater', price: 18, quantity: 85 }
    ],
    5: [
      { id: 1, name: 'T-Shirt', price: 5, quantity: 160 },
      { id: 2, name: 'Jeans', price: 15, quantity: 80 },
      { id: 3, name: 'Jacket', price: 25, quantity: 42 },
      { id: 4, name: 'Shoes', price: 20, quantity: 58 },
      { id: 5, name: 'Sweater', price: 18, quantity: 92 }
    ],
    6: [
      { id: 1, name: 'T-Shirt', price: 5, quantity: 130 },
      { id: 2, name: 'Jeans', price: 15, quantity: 68 },
      { id: 3, name: 'Jacket', price: 25, quantity: 38 },
      { id: 4, name: 'Shoes', price: 20, quantity: 50 },
      { id: 5, name: 'Sweater', price: 18, quantity: 75 }
    ]
  });

  const [sales, setSales] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('moonstar_data');

    if (saved) {
      try {
        const data = JSON.parse(saved);

        if (data.inventory) {
          setInventory(data.inventory);
        }

        if (data.sales) {
          setSales(data.sales);
        }
      } catch (error) {
        console.error('Unable to load saved data:', error);
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(
      'moonstar_data',
      JSON.stringify({
        inventory,
        sales
      })
    );
  }, [inventory, sales]);

  const addToCart = (item) => {
    const existingItem = cart.find((i) => i.id === item.id);

    if (existingItem) {
      if (existingItem.quantity < item.quantity) {
        setCart(
          cart.map((i) =>
            i.id === item.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        );
      }
    } else {
      setCart([
        ...cart,
        {
          ...item,
          quantity: 1,
          storeId: selectedStore
        }
      ]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((i) => i.id !== itemId));
  };

  const updateCartQuantity = (itemId, qty) => {
    if (qty <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(
        cart.map((i) =>
          i.id === itemId
            ? { ...i, quantity: qty }
            : i
        )
      );
    }
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const discount = subtotal * (discountPercent / 100);

    return {
      subtotal,
      discount,
      total: subtotal - discount
    };
  };

  const completeSale = () => {
    if (cart.length === 0) {
      return;
    }

    const { subtotal, total, discount } = calculateTotal();

    const saleRecord = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      storeId: selectedStore,
      items: cart,
      subtotal,
      discount,
      total,
      discountPercent
    };

    setSales([...sales, saleRecord]);

    const newInventory = { ...inventory };

    newInventory[selectedStore] = newInventory[selectedStore].map(
      (invItem) => {
        const cartItem = cart.find(
          (item) => item.id === invItem.id
        );

        if (cartItem) {
          return {
            ...invItem,
            quantity: Math.max(
              0,
              invItem.quantity - cartItem.quantity
            )
          };
        }

        return invItem;
      }
    );

    setInventory(newInventory);
    setCart([]);
    setDiscountPercent(0);

    alert(`Sale completed! Total: PKR ${total.toFixed(2)}`);
  };

  // =========================
  // CHECKOUT VIEW
  // =========================

  if (currentView === 'checkout') {
    const currentInventory = inventory[selectedStore] || [];
    const { subtotal, discount, total } = calculateTotal();

    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <div
          style={{ backgroundColor: '#16213e' }}
          className="text-white p-4 shadow-lg"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-cyan-400">
                  🌙 MOON STAR POS
                </h1>

                <p className="text-gray-300">
                  Investment Trading Corporation
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-400">
                  {new Date().toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => setSelectedStore(store.id)}
                  className={`px-4 py-2 rounded transition ${
                    selectedStore === store.id
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  <MapPin
                    className="inline mr-1"
                    size={16}
                  />

                  {store.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Products */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4 text-white">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Package size={24} />
                Available Items
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentInventory.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg">
                          {item.name}
                        </h3>

                        <p className="text-green-400 font-bold text-xl">
                          PKR {item.price}
                        </p>
                      </div>

                      <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                        Stock: {item.quantity}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(item)}
                      disabled={item.quantity === 0}
                      className={`w-full py-2 rounded font-bold transition ${
                        item.quantity === 0
                          ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                          : 'bg-cyan-500 text-black hover:bg-cyan-400'
                      }`}
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="bg-gray-800 rounded-lg p-4 text-white h-fit sticky top-4">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <DollarSign size={24} />
              Cart
            </h2>

            {cart.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Cart is empty
              </p>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-700 p-3 rounded flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <p className="font-bold">
                          {item.name}
                        </p>

                        <p className="text-sm text-gray-300">
                          PKR {item.price} × {item.quantity}
                        </p>
                      </div>

                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() =>
                            updateCartQuantity(
                              item.id,
                              item.quantity - 1
                            )
                          }
                          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="w-8 text-center font-bold">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateCartQuantity(
                              item.id,
                              item.quantity + 1
                            )
                          }
                          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded"
                        >
                          <Plus size={14} />
                        </button>

                        <button
                          onClick={() =>
                            removeFromCart(item.id)
                          }
                          className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded ml-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount */}
                <div className="bg-gray-700 p-3 rounded mb-3">
                  <label className="text-sm text-gray-300 block mb-2">
                    Discount %
                  </label>

                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) =>
                      setDiscountPercent(
                        Math.min(
                          100,
                          Math.max(
                            0,
                            parseFloat(e.target.value) || 0
                          )
                        )
                      )
                    }
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500"
                    min="0"
                    max="100"
                  />
                </div>

                {/* Totals */}
                <div className="bg-gray-700 p-3 rounded mb-4 space-y-2 border-t-2 border-cyan-500">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>

                    <span>
                      PKR {subtotal.toFixed(2)}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-red-400">
                      <span>
                        Discount ({discountPercent}%):
                      </span>

                      <span>
                        -PKR {discount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-xl font-bold text-green-400 pt-2 border-t border-gray-600">
                    <span>Total:</span>

                    <span>
                      PKR {total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={completeSale}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded text-lg transition"
                >
                  Complete Sale
                </button>
              </>
            )}

            <button
              onClick={() => setCurrentView('inventory')}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition flex items-center justify-center gap-2"
            >
              <Package size={18} />
              Manage Inventory
            </button>

            <button
              onClick={() => setCurrentView('reports')}
              className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition flex items-center justify-center gap-2"
            >
              <BarChart3 size={18} />
              View Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // INVENTORY VIEW
  // =========================

  if (currentView === 'inventory') {
    const currentInventory = inventory[selectedStore] || [];

    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <div
          style={{ backgroundColor: '#16213e' }}
          className="text-white p-4 mb-6"
        >
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setCurrentView('checkout')}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-4 py-2 rounded mb-4"
            >
              ← Back to Checkout
            </button>

            <h1 className="text-3xl font-bold text-cyan-400">
              📦 Inventory Management
            </h1>

            <p className="text-gray-300">
              Store:{' '}
              {stores.find(
                (s) => s.id === selectedStore
              )?.name}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-gray-800 rounded-lg overflow-hidden text-white">
            <table className="w-full">
              <thead
                style={{ backgroundColor: '#16213e' }}
              >
                <tr>
                  <th className="px-4 py-3 text-left">
                    Item
                  </th>

                  <th className="px-4 py-3 text-right">
                    Unit Price
                  </th>

                  <th className="px-4 py-3 text-right">
                    Quantity
                  </th>

                  <th className="px-4 py-3 text-right">
                    Total Value
                  </th>

                  <th className="px-4 py-3 text-center">
                    Adjust
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentInventory.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-700 hover:bg-gray-700"
                  >
                    <td className="px-4 py-3">
                      {item.name}
                    </td>

                    <td className="px-4 py-3 text-right text-green-400">
                      PKR {item.price}
                    </td>

                    <td className="px-4 py-3 text-right font-bold">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-3 text-right text-yellow-400">
                      PKR{' '}
                      {(
                        item.price * item.quantity
                      ).toFixed(2)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            const newInventory = {
                              ...inventory
                            };

                            newInventory[selectedStore] =
                              newInventory[
                                selectedStore
                              ].map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      quantity:
                                        Math.max(
                                          0,
                                          i.quantity - 1
                                        )
                                    }
                                  : i
                              );

                            setInventory(newInventory);
                          }}
                          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                        >
                          <Minus size={16} />
                        </button>

                        <button
                          onClick={() => {
                            const newInventory = {
                              ...inventory
                            };

                            newInventory[selectedStore] =
                              newInventory[
                                selectedStore
                              ].map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      quantity:
                                        i.quantity + 1
                                    }
                                  : i
                              );

                            setInventory(newInventory);
                          }}
                          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mt-6 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Inventory Summary
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded">
                <p className="text-gray-400">
                  Total Items
                </p>

                <p className="text-3xl font-bold text-cyan-400">
                  {currentInventory.reduce(
                    (sum, item) =>
                      sum + item.quantity,
                    0
                  )}
                </p>
              </div>

              <div className="bg-gray-700 p-4 rounded">
                <p className="text-gray-400">
                  SKUs
                </p>

                <p className="text-3xl font-bold text-blue-400">
                  {currentInventory.length}
                </p>
              </div>

              <div className="bg-gray-700 p-4 rounded">
                <p className="text-gray-400">
                  Inventory Value
                </p>

                <p className="text-2xl font-bold text-green-400">
                  PKR{' '}
                  {currentInventory
                    .reduce(
                      (sum, item) =>
                        sum +
                        item.price *
                          item.quantity,
                      0
                    )
                    .toFixed(2)}
                </p>
              </div>

              <div className="bg-gray-700 p-4 rounded">
                <p className="text-gray-400">
                  Low Stock Items
                </p>

                <p className="text-3xl font-bold text-yellow-400">
                  {currentInventory.filter(
                    (item) => item.quantity < 20
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // REPORTS VIEW
  // =========================

  if (currentView === 'reports') {
    const storeSales = sales.filter(
      (s) => s.storeId === selectedStore
    );

    const allStoreSales = sales;

    const totalRevenue = storeSales.reduce(
      (sum, s) => sum + s.total,
      0
    );

    const totalAllRevenue = allStoreSales.reduce(
      (sum, s) => sum + s.total,
      0
    );

    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <div
          style={{ backgroundColor: '#16213e' }}
          className="text-white p-4 mb-6"
        >
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setCurrentView('checkout')}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-4 py-2 rounded mb-4"
            >
              ← Back to Checkout
            </button>

            <h1 className="text-3xl font-bold text-cyan-400">
              📊 Sales Reports
            </h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-900 rounded-lg p-6 text-white">
              <p className="text-gray-300 text-sm">
                Current Store Revenue
              </p>

              <p className="text-3xl font-bold text-cyan-400">
                PKR {totalRevenue.toFixed(2)}
              </p>

              <p className="text-xs text-gray-400 mt-2">
                Transactions: {storeSales.length}
              </p>
            </div>

            <div className="bg-green-900 rounded-lg p-6 text-white">
              <p className="text-gray-300 text-sm">
                All Stores Revenue
              </p>

              <p className="text-3xl font-bold text-green-400">
                PKR {totalAllRevenue.toFixed(2)}
              </p>

              <p className="text-xs text-gray-400 mt-2">
                Total Transactions:{' '}
                {allStoreSales.length}
              </p>
            </div>

            <div className="bg-purple-900 rounded-lg p-6 text-white">
              <p className="text-gray-300 text-sm">
                Avg Transaction
              </p>

              <p className="text-3xl font-bold text-purple-400">
                PKR{' '}
                {storeSales.length > 0
                  ? (
                      totalRevenue /
                      storeSales.length
                    ).toFixed(2)
                  : '0.00'}
              </p>
            </div>

            <div className="bg-yellow-900 rounded-lg p-6 text-white">
              <p className="text-gray-300 text-sm">
                Total Items Sold
              </p>

              <p className="text-3xl font-bold text-yellow-400">
                {storeSales.reduce(
                  (sum, s) =>
                    sum +
                    s.items.reduce(
                      (itemSum, i) =>
                        itemSum + i.quantity,
                      0
                    ),
                  0
                )}
              </p>
            </div>
          </div>

          {/* Sales by Store */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Sales by Store
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map((store) => {
                const storeTotalSales =
                  allStoreSales.filter(
                    (s) => s.storeId === store.id
                  );

                const storeRevenue =
                  storeTotalSales.reduce(
                    (sum, s) => sum + s.total,
                    0
                  );

                return (
                  <div
                    key={store.id}
                    className="bg-gray-700 p-4 rounded"
                  >
                    <h3 className="font-bold text-lg mb-2">
                      {store.name}
                    </h3>

                    <p className="text-gray-300 text-sm">
                      Revenue:{' '}
                      <span className="text-green-400 font-bold">
                        PKR{' '}
                        {storeRevenue.toFixed(2)}
                      </span>
                    </p>

                    <p className="text-gray-300 text-sm">
                      Transactions:{' '}
                      <span className="font-bold">
                        {storeTotalSales.length}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-gray-800 rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Recent Transactions (
              {
                stores.find(
                  (s) => s.id === selectedStore
                )?.name
              }
              )
            </h2>

            {storeSales.length === 0 ? (
              <p className="text-gray-400">
                No sales yet for this store
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead
                    style={{
                      backgroundColor: '#16213e'
                    }}
                  >
                    <tr>
                      <th className="px-4 py-2 text-left">
                        Date & Time
                      </th>

                      <th className="px-4 py-2 text-center">
                        Items
                      </th>

                      <th className="px-4 py-2 text-right">
                        Discount
                      </th>

                      <th className="px-4 py-2 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...storeSales]
                      .reverse()
                      .map((sale) => (
                        <tr
                          key={sale.id}
                          className="border-t border-gray-700 hover:bg-gray-700"
                        >
                          <td className="px-4 py-2">
                            {sale.timestamp}
                          </td>

                          <td className="px-4 py-2 text-center">
                            {sale.items.reduce(
                              (sum, i) =>
                                sum + i.quantity,
                              0
                            )}
                          </td>

                          <td className="px-4 py-2 text-right">
                            {sale.discountPercent}%
                          </td>

                          <td className="px-4 py-2 text-right text-green-400 font-bold">
                            PKR{' '}
                            {sale.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
