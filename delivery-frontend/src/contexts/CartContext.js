import React, { createContext, useContext, useState } from "react";

// 1. Context 생성 (설계도)
const CartContext = createContext();

// 2. Context를 사용하기 위한 커스텀 훅 (간편하게 쓰기 위함)
export function useCart() {
  return useContext(CartContext);
}

// 3. Context를 제공하는 컴포넌트 (실제 장바구니 로직)
export function CartProvider({ children }) {
  // 'cartItems' 배열에 장바구니에 담긴 상품들을 저장합니다.
  const [cartItems, setCartItems] = useState([]);

  // 장바구니에 아이템을 추가하는 함수
  const addToCart = (product) => {
    // 1. 이미 장바구니에 있는지 확인
    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      // 2. 이미 있다면 수량(quantity)만 1 증가
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // 3. 없다면, quantity: 1 속성을 추가해서 새로 배열에 추가
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  // 나중에 만들 기능 (지금은 빈 함수)
  const removeFromCart = (productId) => {
    /* ... */
  };
  const clearCart = () => {
    /* ... */
  };

  // 4. 자식 컴포넌트들에게 '상태'와 '함수'를 내려줍니다.
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
