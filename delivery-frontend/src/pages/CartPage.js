import React from "react";
import { useCart } from "../contexts/CartContext"; // 1. useCart 훅 import
import "./CartPage.css"; // 2. 장바구니 페이지용 CSS import

function CartPage() {
  // 3. 글로벌 장바구니에서 '상태'와 '함수'들을 가져옵니다.
  const { cartItems, removeFromCart, clearCart } = useCart();

  // 4. 총 주문 금액 계산 (reduce 함수 사용)
  const totalPrice = cartItems.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  // 5. 수량 변경 핸들러 (나중에 구현)
  const handleQuantityChange = (productId, newQuantity) => {
    // TODO: CartContext에 수량 변경 함수 추가 필요
    console.log(`상품 ${productId}의 수량을 ${newQuantity}로 변경`);
  };

  // 6. 장바구니가 비어있을 때
  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <h1>장바구니</h1>
        <p className="empty-cart-message">장바구니가 비어있습니다.</p>
      </div>
    );
  }

  // 7. 장바구니에 상품이 있을 때
  return (
    <div className="cart-page">
      <h1>장바구니</h1>

      {/* 장바구니 비우기 버튼 */}
      <button onClick={clearCart} className="clear-cart-btn">
        전체 비우기
      </button>

      {/* 상품 목록 */}
      <div className="cart-item-list">
        {cartItems.map((item) => (
          <div key={item.id} className="cart-item">
            <img
              src={`http://localhost:8080${item.imageUrl}`}
              alt={item.name}
              className="cart-item-image"
            />
            <div className="cart-item-details">
              <h4>{item.name}</h4>
              <p>{item.price.toLocaleString("ko-KR")}원</p>
            </div>
            <div className="cart-item-actions">
              {/* TODO: 수량 조절 버튼 */}
              <input
                type="number"
                value={item.quantity}
                min="1"
                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                className="quantity-input"
              />
              <button
                onClick={() => removeFromCart(item.id)}
                className="remove-btn"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 총 결제 금액 */}
      <div className="cart-summary">
        <h3>총 주문 금액</h3>
        <p className="total-price">{totalPrice.toLocaleString("ko-KR")}원</p>
        <button className="order-btn">주문하기</button>
      </div>
    </div>
  );
}

export default CartPage;
