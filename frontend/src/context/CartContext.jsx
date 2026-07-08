import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (producto, cantidad = 1) => {
    setCartItems(prev => {
      const index = prev.findIndex(item => item.producto._id === producto._id);
      if (index > -1) {
        const updated = [...prev];
        updated[index].cantidad += cantidad;
        return updated;
      }
      return [...prev, { producto, cantidad }];
    });
  };

  const removeFromCart = (productoId) => {
    setCartItems(prev => prev.filter(item => item.producto._id !== productoId));
  };

  const updateQuantity = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      removeFromCart(productoId);
      return;
    }
    setCartItems(prev => prev.map(item => 
      item.producto._id === productoId 
        ? { ...item, cantidad: nuevaCantidad }
        : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Cantidad total de items
  const cartQuantity = cartItems.reduce((total, item) => total + item.cantidad, 0);

  // Total de la compra
  const cartTotal = cartItems.reduce((total, item) => total + (item.producto.precio * item.cantidad), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartQuantity,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
}
