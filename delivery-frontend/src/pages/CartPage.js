import React from "react";
import { useCart } from "../contexts/CartContext"; // 1. useCart 훅 import
import "./CartPage.css"; // 2. 장바구니 페이지용 CSS import
import { useAuth } from "../contexts/AuthContext"; // 👈 1. useAuth 추가
import { useNavigate } from "react-router-dom"; // 👈 2. useNavigate 추가
import axios from "axios"; // 👈 3. axios 추가

function CartPage() {
  // 3. 글로벌 장바구니에서 '상태'와 '함수'들을 가져옵니다.
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { isLoggedIn, token } = useAuth(); // 4. 로그인 여부와 토큰 가져오기
  const navigate = useNavigate();

  // 4. 총 주문 금액 계산 (reduce 함수 사용)
  const totalPrice = cartItems.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  const handleOrder = async () => {
    // (1) 로그인이 안 되어 있다면 로그인 페이지로 보냅니다.
    if (!isLoggedIn) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login");
      return;
    }

    // (2) 장바구니가 비어있으면 중단
    if (cartItems.length === 0) {
      alert("장바구니에 담긴 상품이 없습니다.");
      return;
    }

    // (3) 백엔드에 보낼 데이터 포맷 만들기 (DTO 맞추기)
    // 백엔드 OrderRequestDto가 보통 { menuId, quantity } 리스트를 받습니다.
    // 본인의 백엔드 DTO 구조를 꼭 확인해야 합니다!
    const orderDto = {
      // 만약 storeId가 필요하다면 여기서 추가해야 합니다.
      // (현재 카트 아이템엔 storeId가 없어서, 필요하다면 로직 추가가 필요함)

      orderItems: cartItems.map((item) => ({
        menuId: item.id, // 상품 ID
        quantity: item.quantity, // 수량
        // price: item.price // (보통 가격은 백엔드에서 DB 기준으로 다시 계산하므로 안 보냄)
      })),
    };

    try {
      // (4) 주문 API 호출 (POST)
      // 헤더에 Authorization: Bearer 토큰을 같이 보냅니다.
      await axios.post("http://localhost:8080/api/orders", orderDto, {
        headers: {
          Authorization: `Bearer ${token}`, // 👈 중요: JWT 토큰 실어 보내기
        },
      });

      // (5) 성공 시 처리
      alert("주문이 성공적으로 접수되었습니다!");
      clearCart(); // 장바구니 비우기
      navigate("/"); // 홈으로 이동 (또는 주문 내역 페이지)
    } catch (error) {
      console.error("주문 실패:", error);
      alert("주문에 실패했습니다. 다시 시도해주세요.");
    }
  };

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
