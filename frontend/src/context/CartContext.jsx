import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

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
    const itemExistente = cartItems.find(item => item.producto._id === producto._id);
    const cantidadActual = itemExistente ? itemExistente.cantidad : 0;
    const cantidadTotal = cantidadActual + cantidad;

    // La validación de stock corre ANTES de setCartItems, no adentro del updater:
    // el updater de setState puede invocarse más de una vez (ej. StrictMode en dev)
    // y no debe tener efectos secundarios como un toast.
    if (producto.stock !== undefined && cantidadTotal > producto.stock) {
      toast.error(`Solo hay ${producto.stock} unidades disponibles`);
      return;
    }

    setCartItems(prev => {
      const index = prev.findIndex(item => item.producto._id === producto._id);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], cantidad: cantidadTotal };
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

    const item = cartItems.find(i => i.producto._id === productoId);
    if (item?.producto.stock !== undefined && nuevaCantidad > item.producto.stock) {
      toast.error(`Solo hay ${item.producto.stock} unidades disponibles`);
      return;
    }

    setCartItems(prev => prev.map(i =>
      i.producto._id === productoId
        ? { ...i, cantidad: nuevaCantidad }
        : i
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
