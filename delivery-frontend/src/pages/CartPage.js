import React, { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import "./CartPage.css";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function CartPage() {
  const { cartItems, removeFromCart, clearCart, updateQuantity } = useCart();
  const { isLoggedIn, token } = useAuth();
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState([]);
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  // 1. 가게 정보 유치 (백엔드에서 내려준 첫 번째 아이템 데이터 기준)
  const storeId = cartItems.length > 0 ? cartItems[0].storeId : null;
  const deliveryFee = cartItems.length > 0 ? cartItems[0].deliveryFee || 0 : 0;
  const minOrderPrice =
    cartItems.length > 0 ? cartItems[0].minOrderAmount || 0 : 0;

  // 개별 아이템의 총액 (단가 * 수량)
  const getItemTotalPrice = (item) => {
    return item.unitPrice * item.quantity;
  };

  // 전체 상품 총액
  const itemTotal = cartItems.reduce(
    (sum, item) => sum + getItemTotalPrice(item),
    0
  );

  const finalPrice = Math.max(0, itemTotal + deliveryFee - discountAmount);

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

  const handleCouponSelect = (e) => {
    const cId = e.target.value;
    setSelectedCouponId(cId);

    if (!cId) {
      setDiscountAmount(0);
      return;
    }

    const coupon = coupons.find((c) => c.id === Number(cId));

    if (itemTotal < coupon.minOrderAmount) {
      alert(
        `이 쿠폰은 상품 금액이 ${coupon.minOrderAmount.toLocaleString()}원 이상일 때 사용 가능합니다.`
      );
      setSelectedCouponId("");
      setDiscountAmount(0);
      return;
    }
    setDiscountAmount(coupon.discountAmount);
  };

  const handleOrder = async () => {
    if (!isLoggedIn) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      alert("장바구니에 담긴 상품이 없습니다.");
      return;
    }

    if (itemTotal < minOrderPrice) {
      alert(
        `해당 가게의 최소 주문 금액은 ${minOrderPrice.toLocaleString()}원입니다.`
      );
      return;
    }

    try {
      const orderData = {
        storeId: storeId,
        orderItems: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          optionIds: item.options ? item.options.map((o) => o.optionId) : [],
        })),
        userCouponId: selectedCouponId ? Number(selectedCouponId) : null,
        totalPrice: finalPrice,
      };

      await axios.post("http://localhost:8080/api/orders", orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("주문이 성공적으로 접수되었습니다! 🙇🏻‍♂️");
      clearCart();
      navigate("/orders");
    } catch (error) {
      alert(error.response?.data?.message || "주문에 실패했습니다.");
    }
  };

  const handleQuantityChange = (cartItemId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) return;
    updateQuantity(cartItemId, quantity);
  };

  if (cartItems.length === 0) {
    return (
      <div
        className="cart-page"
        style={{ padding: "40px", textAlign: "center" }}
      >
        <h1>🛒 장바구니</h1>
        <p>장바구니가 비어있습니다. 맛있는 음식을 담아보세요!</p>
        <button onClick={() => navigate("/")} style={homeBtnStyle}>
          홈으로 가기
        </button>
      </div>
    );
  }

  return (
    <div
      className="cart-page"
      style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}
    >
      <h2>장바구니</h2>
      <button onClick={clearCart} style={clearBtnStyle}>
        전체삭제
      </button>

      <div className="cart-item-list" style={{ marginTop: "40px" }}>
        {cartItems.map((item) => (
          <div key={item.cartItemId} className="cart-item" style={itemStyle}>
            <img
              src={`http://localhost:8080${item.imageUrl}`}
              alt={item.productName}
              style={imgStyle}
            />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0" }}>{item.productName}</h4>

              {item.options && item.options.length > 0 && (
                <div style={optionContainerStyle}>
                  {item.options.map((opt, idx) => (
                    <div key={idx} style={optionItemStyle}>
                      └ {opt.name} (+{opt.additionalPrice?.toLocaleString()}원)
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <input
                  type="number"
                  value={item.quantity}
                  min="1"
                  onChange={(e) =>
                    handleQuantityChange(item.cartItemId, e.target.value)
                  }
                  style={{ width: "45px", padding: "5px" }}
                />
                <button
                  onClick={() => removeFromCart(item.cartItemId)}
                  style={removeBtnStyle}
                >
                  삭제
                </button>
              </div>
            </div>
            <div style={{ fontWeight: "bold", textAlign: "right" }}>
              {getItemTotalPrice(item).toLocaleString()}원
            </div>
          </div>
        ))}
      </div>

      <div className="payment-summary" style={summaryStyle}>
        <div style={rowStyle}>
          <span>할인 쿠폰</span>
          <select value={selectedCouponId} onChange={handleCouponSelect}>
            <option value="">쿠폰 선택</option>
            {coupons.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (-{c.discountAmount}원)
              </option>
            ))}
          </select>
        </div>
        <hr />
        <div style={rowStyle}>
          <span>주문 금액</span>
          <span>{itemTotal.toLocaleString()}원</span>
        </div>
        <div style={rowStyle}>
          <span>배달팁</span>
          <span>{deliveryFee.toLocaleString()}원</span>
        </div>
        <div style={{ ...rowStyle, color: "red" }}>
          <span>쿠폰 할인</span>
          <span>-{discountAmount.toLocaleString()}원</span>
        </div>
        <div
          style={{
            ...rowStyle,
            fontSize: "1.2rem",
            fontWeight: "bold",
            marginTop: "10px",
          }}
        >
          <span>총 결제금액</span>
          <span style={{ color: "#339af0" }}>
            {finalPrice.toLocaleString()}원
          </span>
        </div>

        {itemTotal < minOrderPrice && (
          <p style={{ color: "red", fontSize: "0.85rem", textAlign: "right" }}>
            * 최소 주문 금액 {minOrderPrice.toLocaleString()}원까지{" "}
            {(minOrderPrice - itemTotal).toLocaleString()}원 더 담아주세요.
          </p>
        )}

        <button
          onClick={handleOrder}
          disabled={itemTotal < minOrderPrice}
          style={orderBtnStyle(itemTotal >= minOrderPrice)}
        >
          {finalPrice.toLocaleString()}원 주문하기
        </button>
      </div>
    </div>
  );
}

const itemStyle = {
  display: "flex",
  gap: "15px",
  padding: "15px 0",
  borderBottom: "1px solid #eee",
  alignItems: "center",
};
const imgStyle = {
  width: "70px",
  height: "70px",
  borderRadius: "8px",
  objectFit: "cover",
};
const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  margin: "8px 0",
};
const summaryStyle = {
  marginTop: "30px",
  padding: "20px",
  backgroundColor: "#f8f9fa",
  borderRadius: "10px",
};
const homeBtnStyle = {
  marginTop: "20px",
  padding: "10px 25px",
  backgroundColor: "#339af0",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};
const removeBtnStyle = {
  fontSize: "0.8rem",
  color: "#ff5252",
  border: "1px solid #ff5252",
  background: "none",
  padding: "2px 5px",
  borderRadius: "3px",
  cursor: "pointer",
};
const clearBtnStyle = {
  float: "right",
  color: "#888",
  border: "none",
  background: "none",
  cursor: "pointer",
};
const optionContainerStyle = {
  marginTop: "5px",
  padding: "5px 10px",
  backgroundColor: "#f1f3f5",
  borderRadius: "5px",
};
const optionItemStyle = {
  fontSize: "0.85rem",
  color: "#495057",
  lineHeight: "1.4",
};
const orderBtnStyle = (active) => ({
  width: "100%",
  padding: "15px",
  backgroundColor: active ? "#339af0" : "#ccc",
  color: "white",
  border: "none",
  borderRadius: "5px",
  fontSize: "1.1rem",
  fontWeight: "bold",
  marginTop: "20px",
  cursor: active ? "pointer" : "not-allowed",
});

export default CartPage;
