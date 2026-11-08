import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CartPage.css";

const API_BASE_URL = "http://localhost:8080";

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

  // 결제
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [pendingPayment, setPendingPayment] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const getAuthConfig = useCallback(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token],
  );

  // 상품 가격 + 선택 옵션 가격에 수량을 곱한 금액
  const getItemTotalPrice = (item) => {
    const productPrice = Number(item.price ?? item.unitPrice ?? 0);
    const optionTotal = (item.options || []).reduce(
      (sum, option) =>
        sum + Number(option.additionalPrice ?? option.price ?? 0),
      0,
    );

    return (productPrice + optionTotal) * Number(item.quantity || 0);
  };

  // 1. 장바구니, 쿠폰, 배송 주소 조회
  const fetchData = useCallback(async () => {
    if (!isLoggedIn || !token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const config = getAuthConfig();

      const [cartRes, couponRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/cart`, config),
        axios.get(`${API_BASE_URL}/api/coupons/my`, config),
      ]);

      setCartItems(cartRes.data.items || []);
      setCoupons(Array.isArray(couponRes.data) ? couponRes.data : []);

      // 배송 주소 조회 실패가 장바구니 및 쿠폰 조회에 영향을 주지 않도록 분리
      try {
        const addressRes = await axios.get(
          `${API_BASE_URL}/api/delivery-addresses`,
          config,
        );

        const responseData = addressRes.data;
        const addresses = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.content)
            ? responseData.content
            : [];

        setDeliveryAddresses(addresses);

        const defaultAddress = addresses.find(
          (address) => address.defaultAddress === true,
        );

        setSelectedAddressId(
          String(defaultAddress?.id ?? addresses[0]?.id ?? ""),
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
  }, [isLoggedIn, token, getAuthConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. 가게 정보 및 주문 금액 계산
  const storeId = cartItems.length > 0 ? cartItems[0].storeId : null;

  const deliveryFee =
    cartItems.length > 0 ? Number(cartItems[0].deliveryFee || 0) : 0;

  const minOrderPrice =
    cartItems.length > 0 ? Number(cartItems[0].minOrderAmount || 0) : 0;

  const itemTotal = cartItems.reduce(
    (sum, item) => sum + getItemTotalPrice(item),
    0,
  );

  const finalPrice = Math.max(
    0,
    itemTotal + deliveryFee - Number(discountAmount || 0),
  );

  // 선택 쿠폰이 상품 금액 변경 후에도 유효한지 확인
  useEffect(() => {
    if (!selectedCouponId) {
      setDiscountAmount(0);
      return;
    }

    const selectedCoupon = coupons.find(
      (coupon) => Number(coupon.id) === Number(selectedCouponId),
    );

    if (!selectedCoupon) {
      setSelectedCouponId("");
      setDiscountAmount(0);
      return;
    }

    const minimumAmount = Number(selectedCoupon.minOrderAmount || 0);
    if (itemTotal < minimumAmount) {
      setSelectedCouponId("");
      setDiscountAmount(0);
      return;
    }

    setDiscountAmount(Number(selectedCoupon.discountAmount || 0));
  }, [selectedCouponId, coupons, itemTotal]);

  // 3. 수량 변경
  const handleQuantityChange = async (cartItemId, newQuantity) => {
    const quantity = parseInt(newQuantity, 10);

    if (Number.isNaN(quantity) || quantity < 1) {
      return;
    }

    try {
      await axios.patch(
        `${API_BASE_URL}/api/cart/items/${cartItemId}`,
        { quantity },
        getAuthConfig(),
      );

      setCartItems((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity } : item,
        ),
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
        `${API_BASE_URL}/api/cart/items/${cartItemId}`,
        getAuthConfig(),
      );

      setCartItems((prev) =>
        prev.filter((item) => item.cartItemId !== cartItemId),
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
      await axios.delete(`${API_BASE_URL}/api/cart/clear`, getAuthConfig());

      setCartItems([]);
      setSelectedCouponId("");
      setDiscountAmount(0);
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

    const coupon = coupons.find((item) => Number(item.id) === Number(couponId));

    if (!coupon) {
      setDiscountAmount(0);
      return;
    }

    if (itemTotal < Number(coupon.minOrderAmount || 0)) {
      alert(
        `이 쿠폰은 상품 금액이 ${Number(
          coupon.minOrderAmount || 0,
        ).toLocaleString()}원 이상일 때 사용할 수 있습니다.`,
      );
      setSelectedCouponId("");
      setDiscountAmount(0);
      return;
    }

    setDiscountAmount(Number(coupon.discountAmount || 0));
  };

  // 7. 결제 승인 요청
  const handleApprovePayment = async (payment) => {
    if (!payment?.paymentId || !payment?.gatewayOrderId) {
      throw new Error("결제 준비 응답에 필요한 정보가 없습니다.");
    }

    const approvalRequest = {
      // Mock Gateway에서는 전달값을 실제 PG 인증에 사용하지 않음.
      // 실제 PG 연동 시 결제창 인증 응답의 paymentKey로 교체해야 함.
      paymentKey: "MOCK-REQUEST",
      orderId: payment.gatewayOrderId,
      amount: Number(payment.amount),
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/payments/${payment.paymentId}/approve`,
      approvalRequest,
      getAuthConfig(),
    );

    const approvedPayment = response.data;
    setPendingPayment(approvedPayment);

    if (approvedPayment.status === "APPROVED") {
      setPendingPayment(null);
      alert("결제가 성공적으로 완료되었습니다.");
      navigate("/orders");
      return approvedPayment;
    }

    if (approvedPayment.status === "FAILED") {
      alert(
        "결제에 실패했습니다. 주문은 유지되어 있으므로 다시 결제할 수 있습니다.",
      );
      return approvedPayment;
    }

    alert(
      "결제 결과를 확인하지 못했습니다. 주문 내역에서 결제 상태를 확인해주세요.",
    );
    return approvedPayment;
  };

  // 8. checkout 성공 후 백엔드 장바구니 비우기
  const clearCartAfterCheckout = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/cart/clear`, getAuthConfig());
    } catch (error) {
      // 주문은 이미 생성됐으므로 장바구니 삭제 실패가 결제를 중단시키면 안 됨
      console.error("주문 생성 후 장바구니 비우기 실패:", error);
      alert(
        "주문은 생성되었지만 장바구니 비우기에 실패했습니다. 중복 주문에 주의해주세요.",
      );
    } finally {
      setCartItems([]);
      setSelectedCouponId("");
      setDiscountAmount(0);
    }
  };

  // 9. 주문 생성 및 결제 준비
  const handleOrder = async () => {
    if (!isLoggedIn || !token) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login");
      return;
    }

    if (paymentProcessing) {
      return;
    }

    if (cartItems.length === 0) {
      alert("장바구니에 담긴 상품이 없습니다.");
      return;
    }

    if (itemTotal < minOrderPrice) {
      alert(
        `해당 가게의 최소 주문 금액은 ${minOrderPrice.toLocaleString()}원입니다.`,
      );
      return;
    }

    if (!selectedAddressId) {
      alert("배송 주소를 선택해주세요.");
      return;
    }

    if (!paymentMethod) {
      alert("결제 수단을 선택해주세요.");
      return;
    }

    setPaymentProcessing(true);

    try {
      // 서버가 상품·옵션·쿠폰·배송비를 검증하고 최종 금액을 계산함
      const orderData = {
        storeId,
        deliveryAddressId: Number(selectedAddressId),
        paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          optionIds: item.options
            ? item.options.map((option) => option.optionId)
            : [],
        })),
      };

      // userCouponId는 OrderCreateRequest 본문이 아니라 Query Parameter로 전달
      const checkoutUrl = selectedCouponId
        ? `${API_BASE_URL}/api/payments/checkout?userCouponId=${encodeURIComponent(selectedCouponId)}`
        : `${API_BASE_URL}/api/payments/checkout`;

      // 1) 주문 PENDING 생성 + 쿠폰 예약 + Payment READY 생성
      const checkoutResponse = await axios.post(
        checkoutUrl,
        orderData,
        getAuthConfig(),
      );

      const payment = checkoutResponse.data;
      setPendingPayment(payment);

      // 주문이 생성됐으므로 장바구니를 비운 뒤 승인 시도
      await clearCartAfterCheckout();

      // 2) Mock 또는 PG 승인 처리
      // 승인 요청 오류가 발생해도 checkout 주문은 이미 생성되어 있으므로
      // 주문/결제 정보를 지우거나 새로운 주문을 다시 생성하지 않음
      try {
        await handleApprovePayment(payment);
      } catch (approvalError) {
        console.error("결제 승인 요청 또는 결과 확인 실패:", approvalError);
        alert(
          approvalError.response?.data?.message ||
            "결제 승인 결과를 확인하지 못했습니다. 주문 내역에서 상태를 확인해주세요.",
        );
      }
    } catch (error) {
      console.error("결제 준비 실패:", error);
      alert(error.response?.data?.message || "결제 준비에 실패했습니다.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  // 10. 기존 PENDING 주문의 재결제
  const handleRetryPayment = async () => {
    if (!pendingPayment?.orderId) {
      alert("재결제할 주문 정보가 없습니다.");
      return;
    }

    if (paymentProcessing) {
      return;
    }

    setPaymentProcessing(true);

    try {
      // 기존 주문은 유지하고 새로운 Payment(READY) 생성
      const response = await axios.post(
        `${API_BASE_URL}/api/payments/orders/${pendingPayment.orderId}/retry`,
        {},
        getAuthConfig(),
      );

      const newPayment = response.data;
      setPendingPayment(newPayment);

      await handleApprovePayment(newPayment);
    } catch (error) {
      console.error("재결제 실패:", error);
      alert(
        error.response?.data?.message ||
          "재결제에 실패했습니다. 주문 내역에서 상태를 확인해주세요.",
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  // 11. 로딩 화면
  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>로딩 중... 🛒</div>
    );
  }

  // 12. 결제 실패 또는 결과 확인이 필요한 경우
  // 장바구니가 비어 있어도 재결제 화면을 먼저 표시해야 함
  if (pendingPayment) {
    const canRetry = ["FAILED", "CANCELED"].includes(pendingPayment.status);

    return (
      <div
        className="cart-page"
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <h2>결제 처리</h2>

        <p>주문번호: {pendingPayment.orderId}</p>
        <p>
          결제 금액: {Number(pendingPayment.amount || 0).toLocaleString()}원
        </p>
        <p>결제 상태: {pendingPayment.status}</p>

        {pendingPayment.status === "FAILED" && (
          <p style={{ color: "#d9480f" }}>
            결제에 실패했습니다. 기존 주문으로 다시 결제할 수 있습니다.
          </p>
        )}

        {pendingPayment.status === "CANCELED" && (
          <p style={{ color: "#666" }}>
            결제 시도가 취소되었습니다. 기존 주문으로 다시 결제할 수 있습니다.
          </p>
        )}

        {pendingPayment.status === "READY" && (
          <p style={{ color: "#d9480f" }}>
            결제 승인 결과를 확인하지 못했습니다. 중복 결제를 방지하기 위해 주문
            내역에서 결제 상태를 먼저 확인해주세요.
          </p>
        )}

        {canRetry && (
          <button
            type="button"
            onClick={handleRetryPayment}
            disabled={paymentProcessing}
            style={orderBtnStyle(!paymentProcessing)}
          >
            {paymentProcessing ? "결제 처리 중..." : "다시 결제하기"}
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate("/orders")}
          style={{ ...homeBtnStyle, marginLeft: "10px" }}
        >
          주문 내역으로 이동
        </button>
      </div>
    );
  }

  // 13. 로그인이 안 된 경우
  if (!isLoggedIn || !token) {
    return (
      <div
        className="cart-page"
        style={{ padding: "40px", textAlign: "center" }}
      >
        <h1>🛒 장바구니</h1>
        <p>로그인이 필요한 서비스입니다.</p>
        <button onClick={() => navigate("/login")} style={homeBtnStyle}>
          로그인하기
        </button>
      </div>
    );
  }

  // 14. 장바구니가 비어 있는 경우
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

  // 15. 장바구니 화면
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
        disabled={paymentProcessing}
      >
        전체삭제
      </button>

      {/* 장바구니 상품 목록 */}
      <div className="cart-item-list" style={{ marginTop: "40px" }}>
        {cartItems.map((item) => (
          <div key={item.cartItemId} className="cart-item" style={itemStyle}>
            <img
              src={`${API_BASE_URL}${item.imageUrl}`}
              alt={item.productName}
              style={imgStyle}
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/70";
              }}
            />

            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0" }}>{item.productName}</h4>

              {item.options && item.options.length > 0 && (
                <div style={optionContainerStyle}>
                  {item.options.map((option, idx) => (
                    <div key={idx} style={optionItemStyle}>
                      └ {option.name} (+
                      {Number(
                        option.additionalPrice ?? option.price ?? 0,
                      ).toLocaleString()}
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
                  disabled={paymentProcessing}
                  onChange={(e) =>
                    handleQuantityChange(item.cartItemId, e.target.value)
                  }
                  style={{
                    width: "45px",
                    padding: "5px",
                  }}
                />

                <button
                  onClick={() => handleRemoveItem(item.cartItemId)}
                  style={removeBtnStyle}
                  disabled={paymentProcessing}
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

      {/* 16. 배송 주소 선택 */}
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
            disabled={paymentProcessing}
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
            onChange={(e) => setSelectedAddressId(e.target.value)}
            disabled={paymentProcessing}
            style={{
              width: "100%",
              padding: "10px",
            }}
          >
            <option value="">배송지를 선택하세요</option>

            {deliveryAddresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.name || "배송지"}
                {address.defaultAddress ? " (기본)" : ""}
                {" - "}
                {address.address}
                {address.detailAddress ? ` ${address.detailAddress}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 17. 결제 금액, 쿠폰 및 결제 수단 */}
      <div className="payment-summary" style={summaryStyle}>
        <div style={rowStyle}>
          <span>할인 쿠폰</span>

          <select
            value={selectedCouponId}
            onChange={handleCouponSelect}
            disabled={paymentProcessing}
          >
            <option value="">쿠폰 선택</option>

            {coupons.map((coupon) => (
              <option key={coupon.id} value={coupon.id}>
                {coupon.name} (-
                {Number(coupon.discountAmount || 0).toLocaleString()}원)
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
          <span>-{Number(discountAmount).toLocaleString()}원</span>
        </div>

        <div
          style={{
            ...rowStyle,
            fontSize: "1.2rem",
            fontWeight: "bold",
            marginTop: "10px",
          }}
        >
          <span>예상 결제금액</span>
          <span style={{ color: "#339af0" }}>
            {finalPrice.toLocaleString()}원
          </span>
        </div>

        {/* 결제 수단 선택 */}
        <div style={paymentMethodBoxStyle}>
          <strong>결제 수단</strong>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            disabled={paymentProcessing}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "8px",
            }}
          >
            <option value="CARD">신용/체크카드</option>
            <option value="TRANSFER">계좌이체</option>
            <option value="VIRTUAL_ACCOUNT">가상계좌</option>
          </select>
        </div>

        {itemTotal < minOrderPrice && (
          <p
            style={{
              color: "red",
              fontSize: "0.85rem",
              textAlign: "right",
            }}
          >
            * 최소 주문 금액 {minOrderPrice.toLocaleString()}원까지{" "}
            {(minOrderPrice - itemTotal).toLocaleString()}원 더 담아주세요.
          </p>
        )}

        <button
          onClick={handleOrder}
          disabled={itemTotal < minOrderPrice || paymentProcessing}
          style={orderBtnStyle(
            itemTotal >= minOrderPrice && !paymentProcessing,
          )}
        >
          {paymentProcessing
            ? "결제 처리 중..."
            : `${finalPrice.toLocaleString()}원 결제하기`}
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

const paymentMethodBoxStyle = {
  marginTop: "18px",
  padding: "12px",
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
