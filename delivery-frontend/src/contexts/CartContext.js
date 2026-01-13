import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  // 초기값을 로컬스토리지에서 가져옴 (새로고침 대비)
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 장바구니 변경 시마다 로컬스토리지에 저장
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    // ✅ 1. 품절 상태 확인 방어 코드
    if (product.available === false) {
      alert("죄송합니다. 현재 품절된 상품입니다.");
      return;
    }

    // ✅ 2. 다른 가게 상품인지 확인 (핵심!)
    // 장바구니에 이미 상품이 있다면, 첫 번째 상품의 storeId와 비교
    if (cartItems.length > 0 && cartItems[0].storeId !== product.storeId) {
      const confirmClear = window.confirm(
        "장바구니에는 같은 가게의 메뉴만 담을 수 있습니다. 기존 장바구니를 비우고 새 가게의 메뉴를 담으시겠습니까?"
      );
      if (confirmClear) {
        setCartItems([{ ...product, quantity: 1 }]);
      }
      return;
    }

    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cart");
  };

  // ✅ 수량 조절 기능 추가 (UX 향상)
  const updateQuantity = (productId, amount) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + amount) }
          : item
      )
    );
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    updateQuantity, // 수량 변경 함수 추가
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
