import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/orders/${orderId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOrder(response.data);
      } catch (error) {
        toast.error("주문 상세 정보를 불러오지 못했습니다.");
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [orderId, token, navigate]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        주문 상세 로딩 중...
      </div>
    );
  if (!order)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        정보를 찾을 수 없습니다.
      </div>
    );

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid #eee",
        borderRadius: "12px",
      }}
    >
      <h2 style={{ borderBottom: "2px solid #333", paddingBottom: "10px" }}>
        주문 상세 내역
      </h2>

      {/* 1. 가게 및 주문 기본 정보 */}
      <section style={sectionStyle}>
        <h3>{order.storeName}</h3>
        <p style={{ color: "#888" }}>
          주문 일시: {new Date(order.orderDate).toLocaleString()}
        </p>
        <p>주문 번호: {order.id}</p>
        <p>
          주문 상태:{" "}
          <span style={{ color: "#339af0", fontWeight: "bold" }}>
            {order.status}
          </span>
        </p>
      </section>

      {/* 2. 주문 상품 및 옵션 리스트 (핵심!) */}
      <section style={sectionStyle}>
        <h4>주문 메뉴</h4>
        {order.orderItems.map((item) => (
          <div
            key={item.id}
            style={{
              marginBottom: "15px",
              borderBottom: "1px solid #f1f3f5",
              paddingBottom: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
              }}
            >
              <span>
                {item.productName} x {item.quantity}
              </span>
              <span>{(item.price * item.quantity).toLocaleString()}원</span>
            </div>

            {/* ✅ 주문 시점에 선택했던 옵션들 표시 */}
            {item.orderOptions && item.orderOptions.length > 0 && (
              <div
                style={{
                  paddingLeft: "15px",
                  marginTop: "5px",
                  color: "#666",
                  fontSize: "0.9rem",
                }}
              >
                {item.orderOptions.map((opt) => (
                  <div
                    key={opt.id}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>└ {opt.name}</span>
                    <span>+{opt.price.toLocaleString()}원</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* 3. 결제 금액 정보 */}
      <section
        style={{
          ...sectionStyle,
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "8px",
        }}
      >
        <div style={rowStyle}>
          <span>주문 금액</span>
          <span>{order.itemTotal.toLocaleString()}원</span>
        </div>
        <div style={rowStyle}>
          <span>배달팁</span>
          <span>+{order.deliveryFee.toLocaleString()}원</span>
        </div>
        <div style={{ ...rowStyle, color: "#e74c3c" }}>
          <span>할인 금액</span>
          <span>-{order.discountAmount.toLocaleString()}원</span>
        </div>
        <hr />
        <div style={{ ...rowStyle, fontSize: "1.2rem", fontWeight: "bold" }}>
          <span>총 결제금액</span>
          <span style={{ color: "#339af0" }}>
            {order.totalPrice.toLocaleString()}원
          </span>
        </div>
      </section>

      <button onClick={() => navigate("/orders")} style={listBtnStyle}>
        주문 목록으로
      </button>
    </div>
  );
}

// 스타일 객체
const sectionStyle = { marginBottom: "30px" };
const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
};
const listBtnStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "20px",
  backgroundColor: "white",
  border: "1px solid #ddd",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

export default OrderDetailPage;
