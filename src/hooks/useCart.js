import { useState, useEffect } from 'react';

const STORAGE_KEY = 'cardapio_cart_v1';

export function useCart() {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Erro ao recuperar carrinho do localStorage', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Erro ao salvar carrinho no localStorage', e);
    }
  }, [items]);

  const addToCart = (product, quantity = 1, notes = '') => {
    setItems((prevItems) => {
      // Cria uma chave única por produto e observação para permitir customizações diferentes do mesmo produto
      const normalizedNotes = notes.trim();
      const existingIndex = prevItems.findIndex(
        (item) => item.product.id === product.id && (item.notes || '').trim() === normalizedNotes
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          itemTotal: newQty * product.price,
        };
        return updated;
      }

      const newItem = {
        cartItemId: `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product,
        quantity,
        notes: normalizedNotes,
        itemTotal: quantity * product.price,
      };

      return [...prevItems, newItem];
    });
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity: newQuantity,
            itemTotal: newQuantity * item.product.price,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartItemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((acc, item) => acc + (item.itemTotal || item.product.price * item.quantity), 0);
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return {
    items,
    subtotal,
    totalCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
}
