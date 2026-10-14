import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CartPage.css";

function CartPage() {
  const { isLoggedIn, token } = useAuth();
  const navigate = useNavigate();

  // 장바구니
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 쿠폰
  const [coupons, setCoupons] = useState([]);
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  // 배송 주소
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  // 1. 장바구니, 쿠폰, 배송 주소 조회
  const fetchData = useCallback(async () => {
    if (!isLoggedIn || !token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [cartRes, couponRes] = await Promise.all([
        axios.get("http://localhost:8080/api/cart", { headers }),
        axios.get("http://localhost:8080/api/coupons/my", { headers }),
      ]);

      setCartItems(cartRes.data.items || []);
      setCoupons(couponRes.data || []);

      // 배송 주소 조회
      // 주소 조회에 실패해도 장바구니와 쿠폰은 사용할 수 있도록 별도 처리
      try {
        const addressRes = await axios.get(
          "http://localhost:8080/api/delivery-addresses",
          { headers }
        );

        const responseData = addressRes.data;

        const addresses = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.content)
            ? responseData.content
            : [];

        setDeliveryAddresses(addresses);

        // 기본 배송지를 우선 선택하고, 없으면 첫 번째 주소 선택
        const defaultAddress = addresses.find(
          (address) => address.defaultAddress === true
        );

        setSelectedAddressId(
          String(defaultAddress?.id ?? addresses[0]?.id ?? "")
        );
      } catch (addressError) {
        console.error("배송 주소 목록 로딩 실패:", addressError);

        setDeliveryAddresses([]);
        setSelectedAddressId("");
      }
    } catch (error) {
      console.error("장바구니 또는 쿠폰 데이터 로딩 실패:", error);
      alert("장바구니 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. 가게 정보 및 주문 금액 계산
  const storeId = cartItems.length > 0
    ? cartItems[0].storeId
    : null;

  const deliveryFee = cartItems.length > 0
    ? cartItems[0].deliveryFee || 0
    : 0;

  const minOrderPrice = cartItems.length > 0
    ? cartItems[0].minOrderAmount || 0
    : 0;

  const getItemTotalPrice = (item) => {
    const price = item.price || item.unitPrice || 0;
    return price * item.quantity;
  };

  const itemTotal = cartItems.reduce(
    (sum, item) => sum + getItemTotalPrice(item),
    0
  );

  const finalPrice = Math.max(
    0,
    itemTotal + deliveryFee - discountAmount
  );

  // 3. 수량 변경
  const handleQuantityChange = async (cartItemId, newQuantity) => {
    const quantity = parseInt(newQuantity, 10);

    if (Number.isNaN(quantity) || quantity < 1) {
      return;
    }

    try {
      await axios.patch(
        `http://localhost:8080/api/cart/items/${cartItemId}`,
        { quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCartItems((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity }
            : item
        )
      );
    } catch (error) {
      console.error("수량 변경 실패:", error);
      alert("수량 변경에 실패했습니다.");
    }
  };

  // 4. 상품 단건 삭제
  const handleRemoveItem = async (cartItemId) => {
    try {
      await axios.delete(
        `http://localhost:8080/api/cart/items/${cartItemId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCartItems((prev) =>
        prev.filter((item) => item.cartItemId !== cartItemId)
      );
    } catch (error) {
      console.error("상품 삭제 실패:", error);
      alert("상품 삭제에 실패했습니다.");
    }
  };

  // 5. 장바구니 전체 비우기
  const handleClearCart = async () => {
    if (!window.confirm("장바구니를 모두 비우시겠습니까?")) {
      return;
    }

    try {
      await axios.delete(
        "http://localhost:8080/api/cart/clear",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCartItems([]);
    } catch (error) {
      console.error("장바구니 비우기 실패:", error);
      alert("장바구니 비우기에 실패했습니다.");
    }
  };

  // 6. 쿠폰 선택
  const handleCouponSelect = (e) => {
    const couponId = e.target.value;

    setSelectedCouponId(couponId);

    if (!couponId) {
      setDiscountAmount(0);
      return;
    }

    const coupon = coupons.find(
      (item) => item.id === Number(couponId)
    );

    if (!coupon) {
      setDiscountAmount(0);
      return;
    }

    if (itemTotal < coupon.minOrderAmount) {
      alert(
        `이 쿠폰은 상품 금액이 ${
          coupon.minOrderAmount.toLocaleString()
        }원 이상일 때 사용 가능합니다.`
      );

      setSelectedCouponId("");
      setDiscountAmount(0);
      return;
    }

    setDiscountAmount(coupon.discountAmount);
  };

  // 7. 주문 생성
  const handleOrder = async () => {
    if (!isLoggedIn || !token) {
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
        `해당 가게의 최소 주문 금액은 ${
          minOrderPrice.toLocaleString()
        }원입니다.`
      );
      return;
    }

    // 배송 주소 선택 여부 확인
    if (!selectedAddressId) {
      alert("배송 주소를 선택해주세요.");
      return;
    }

    try {
      const orderData = {
        storeId,

        // 선택한 배송 주소 ID 전달
        deliveryAddressId: Number(selectedAddressId),

        // OrderService에서 request.getItems()를 사용하므로 items로 전달
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          optionIds: item.options
            ? item.options.map((option) => option.optionId)
            : [],
        })),

        userCouponId: selectedCouponId
          ? Number(selectedCouponId)
          : null,

        totalPrice: finalPrice,
      };

      await axios.post(
        "http://localhost:8080/api/orders",
        orderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("주문이 성공적으로 접수되었습니다! 🙇🏻‍♂️");

      // 주문 성공 시 백엔드 장바구니 비우기
      await axios.delete(
        "http://localhost:8080/api/cart/clear",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCartItems([]);
      navigate("/orders");
    } catch (error) {
      console.error("주문 실패:", error);

      alert(
        error.response?.data?.message || "주문에 실패했습니다."
      );
    }
  };

  // 8. 로딩 화면
  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        로딩 중... 🛒
      </div>
    );
  }

  // 9. 장바구니가 비어 있는 경우
  if (cartItems.length === 0) {
    return (
      <div
        className="cart-page"
        style={{ padding: "40px", textAlign: "center" }}
      >
        <h1>🛒 장바구니</h1>

        <p>
          장바구니가 비어있습니다. 맛있는 음식을 담아보세요!
        </p>

        <button
          onClick={() => navigate("/")}
          style={homeBtnStyle}
        >
          홈으로 가기
        </button>
      </div>
    );
  }

  // 10. 장바구니 화면
  return (
    <div
      className="cart-page"
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h2>장바구니</h2>

      <button
        onClick={handleClearCart}
        style={clearBtnStyle}
      >
        전체삭제
      </button>

      {/* 장바구니 상품 목록 */}
      <div
        className="cart-item-list"
        style={{ marginTop: "40px" }}
      >
        {cartItems.map((item) => (
          <div
            key={item.cartItemId}
            className="cart-item"
            style={itemStyle}
          >
            <img
              src={`http://localhost:8080${item.imageUrl}`}
              alt={item.productName}
              style={imgStyle}
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/70";
              }}
            />

            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0" }}>
                {item.productName}
              </h4>

              {item.options && item.options.length > 0 && (
                <div style={optionContainerStyle}>
                  {item.options.map((option, idx) => (
                    <div
                      key={idx}
                      style={optionItemStyle}
                    >
                      └ {option.name} (+
                      {option.additionalPrice?.toLocaleString() ||
                        option.price?.toLocaleString() ||
                        0}
                      원)
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
                    handleQuantityChange(
                      item.cartItemId,
                      e.target.value
                    )
                  }
                  style={{
                    width: "45px",
                    padding: "5px",
                  }}
                />

                <button
                  onClick={() =>
                    handleRemoveItem(item.cartItemId)
                  }
                  style={removeBtnStyle}
                >
                  삭제
                </button>
              </div>
            </div>

            <div
              style={{
                fontWeight: "bold",
                textAlign: "right",
              }}
            >
              {getItemTotalPrice(item).toLocaleString()}원
            </div>
          </div>
        ))}
      </div>

      {/* 11. 배송 주소 선택 */}
      <div style={addressBoxStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <strong>배송 주소</strong>

          <button
            type="button"
            onClick={() => navigate("/delivery-addresses")}
          >
            배송지 관리
          </button>
        </div>

        {deliveryAddresses.length === 0 ? (
          <div>
            <p>등록된 배송 주소가 없습니다.</p>

            <button
              type="button"
              onClick={() => navigate("/delivery-addresses")}
            >
              배송지 등록하기
            </button>
          </div>
        ) : (
          <select
            value={selectedAddressId}
            onChange={(e) =>
              setSelectedAddressId(e.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
            }}
          >
            <option value="">
              배송지를 선택하세요
            </option>

            {deliveryAddresses.map((address) => (
              <option
                key={address.id}
                value={address.id}
              >
                {address.name || "배송지"}
                {address.defaultAddress ? " (기본)" : ""}
                {" - "}
                {address.address}
                {address.detailAddress
                  ? ` ${address.detailAddress}`
                  : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 12. 결제 금액 및 쿠폰 */}
      <div
        className="payment-summary"
        style={summaryStyle}
      >
        <div style={rowStyle}>
          <span>할인 쿠폰</span>

          <select
            value={selectedCouponId}
            onChange={handleCouponSelect}
          >
            <option value="">쿠폰 선택</option>

            {coupons.map((coupon) => (
              <option
                key={coupon.id}
                value={coupon.id}
              >
                {coupon.name} (-
                {coupon.discountAmount.toLocaleString()}원)
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

        <div
          style={{
            ...rowStyle,
            color: "red",
          }}
        >
          <span>쿠폰 할인</span>
          <span>
            -{discountAmount.toLocaleString()}원
          </span>
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
          <p
            style={{
              color: "red",
              fontSize: "0.85rem",
              textAlign: "right",
            }}
          >
            * 최소 주문 금액{" "}
            {minOrderPrice.toLocaleString()}원까지{" "}
            {(minOrderPrice - itemTotal).toLocaleString()}
            원 더 담아주세요.
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

// 스타일
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

const addressBoxStyle = {
  marginTop: "20px",
  padding: "15px",
  border: "1px solid #ddd",
  borderRadius: "8px",
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