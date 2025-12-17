import React, { useState, useEffect } from "react"; // 👈 useState, useEffect 추가 필수
import { useCart } from "../contexts/CartContext";
import "./CartPage.css";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function CartPage() {
  // 1. Context 및 Hook 가져오기
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { isLoggedIn, token } = useAuth();
  const navigate = useNavigate();

  // 2. State 정의 (쿠폰 및 금액 관련)
  const [coupons, setCoupons] = useState([]);
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  // 3. 금액 계산 로직
  const deliveryFee = 3000; // 배달비 정의 (또는 store 정보에서 가져와야 함)

  const itemTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 최종 결제 금액 (0원 미만 방지)
  const finalPrice = Math.max(0, itemTotal + deliveryFee - discountAmount);

  // 4. 내 쿠폰 목록 불러오기 (useEffect)
  useEffect(() => {
    if (isLoggedIn && token) {
      axios
        .get("http://localhost:8080/api/coupons/my", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setCoupons(res.data))
        .catch((err) => console.error("쿠폰 로딩 실패:", err));
    }
  }, [isLoggedIn, token]);

  // 5. 쿠폰 선택 핸들러
  const handleCouponSelect = (e) => {
    const cId = e.target.value;
    setSelectedCouponId(cId);

    if (!cId) {
      setDiscountAmount(0);
      return;
    }

    const coupon = coupons.find((c) => c.id === Number(cId));

    // 최소 주문 금액 체크
    if (itemTotal < coupon.minOrderAmount) {
      alert(
        `최소 주문 금액 ${coupon.minOrderAmount.toLocaleString()}원 이상이어야 합니다.`
      );
      setSelectedCouponId(""); // 선택 초기화
      setDiscountAmount(0);
      return;
    }
    setDiscountAmount(coupon.discountAmount);
  };

  // 6. 주문하기 핸들러
  const handleOrder = async () => {
    // (1) 로그인 체크
    if (!isLoggedIn) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login");
      return;
    }

    // (2) 장바구니 빈 값 체크
    if (cartItems.length === 0) {
      alert("장바구니에 담긴 상품이 없습니다.");
      return;
    }

    try {
      // (3) 백엔드 전송 데이터 구성
      const orderData = {
        storeId: cartItems[0].storeId, // 주의: 모든 아이템이 같은 가게라고 가정
        orderItems: cartItems.map((item) => ({
          menuId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        userCouponId: selectedCouponId ? Number(selectedCouponId) : null, // 👈 쿠폰 ID 포함
      };

      // (4) API 호출
      await axios.post("http://localhost:8080/api/orders", orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // (5) 성공 처리
      alert("주문이 성공적으로 접수되었습니다! 🙇🏻‍♂️");
      clearCart();
      navigate("/orders"); // 주문 내역 페이지로 이동
    } catch (error) {
      console.error("주문 실패:", error);
      alert(error.response?.data?.message || "주문에 실패했습니다.");
    }
  };

  // 수량 변경 핸들러 (UI만 존재, 로직은 Context에 추가 필요)
  const handleQuantityChange = (productId, newQuantity) => {
    console.log(`상품 ${productId} 수량 변경: ${newQuantity}`);
    // updateQuantity(productId, newQuantity); // 추후 구현 필요
  };

  // 7. 렌더링: 장바구니가 비었을 때
  if (cartItems.length === 0) {
    return (
      <div
        className="cart-page"
        style={{ padding: "20px", textAlign: "center" }}
      >
        <h1>장바구니</h1>
        <p className="empty-cart-message">장바구니가 비어있습니다.</p>
        <button
          onClick={() => navigate("/")}
          style={{ marginTop: "20px", padding: "10px 20px" }}
        >
          홈으로 가기
        </button>
      </div>
    );
  }

  // 8. 렌더링: 상품이 있을 때
  return (
    <div className="cart-page" style={{ padding: "20px" }}>
      <h1>장바구니</h1>

      <button
        onClick={clearCart}
        className="clear-cart-btn"
        style={{ marginBottom: "20px" }}
      >
        전체 비우기
      </button>

      {/* 상품 목록 */}
      <div className="cart-item-list">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="cart-item"
            style={{
              display: "flex",
              marginBottom: "20px",
              borderBottom: "1px solid #eee",
              paddingBottom: "10px",
            }}
          >
            <img
              src={`http://localhost:8080${item.imageUrl}`}
              alt={item.name}
              className="cart-item-image"
              style={{
                width: "80px",
                height: "80px",
                objectFit: "cover",
                marginRight: "15px",
              }}
            />
            <div className="cart-item-details" style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 5px 0" }}>{item.name}</h4>
              <p>{item.price.toLocaleString("ko-KR")}원</p>

              <div className="cart-item-actions" style={{ marginTop: "10px" }}>
                <input
                  type="number"
                  value={item.quantity}
                  min="1"
                  onChange={(e) =>
                    handleQuantityChange(item.id, e.target.value)
                  }
                  className="quantity-input"
                  style={{ width: "50px", marginRight: "10px" }}
                />
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="remove-btn"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 결제 정보 및 쿠폰 선택 */}
      <div
        className="payment-summary"
        style={{
          borderTop: "2px solid #333",
          marginTop: "20px",
          paddingTop: "20px",
          backgroundColor: "#f9f9f9",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        {/* 쿠폰 선택 영역 */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold" }}>🎟️ 할인 쿠폰: </label>
          <select
            value={selectedCouponId}
            onChange={handleCouponSelect}
            style={{ marginLeft: "10px", padding: "8px", width: "200px" }}
          >
            <option value="">선택 안함</option>
            {coupons.map((coupon) => (
              <option key={coupon.id} value={coupon.id}>
                {coupon.name} (-{coupon.discountAmount}원)
              </option>
            ))}
          </select>
        </div>

        <div
          className="price-row"
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "5px",
          }}
        >
          <span>상품 금액</span>
          <span>{itemTotal.toLocaleString()}원</span>
        </div>
        <div
          className="price-row"
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "5px",
          }}
        >
          <span>배달팁</span>
          <span>{deliveryFee.toLocaleString()}원</span>
        </div>
        <div
          className="price-row"
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "15px",
            color: "red",
          }}
        >
          <span>할인 금액</span>
          <span>-{discountAmount.toLocaleString()}원</span>
        </div>

        <hr />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "15px",
          }}
        >
          <h2>총 결제금액</h2>
          <h2 style={{ color: "#339af0" }}>{finalPrice.toLocaleString()}원</h2>
        </div>

        <button
          onClick={handleOrder}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: "#339af0",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "1.2rem",
            fontWeight: "bold",
            marginTop: "20px",
            cursor: "pointer",
          }}
        >
          {finalPrice.toLocaleString()}원 결제하기
        </button>
      </div>
    </div>
  );
}

export default CartPage;
