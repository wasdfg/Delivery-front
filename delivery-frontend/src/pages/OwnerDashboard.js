import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

function OwnerDashboard() {
  const { storeId } = useParams(); // 사장님의 가게 ID
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // 1. 가게의 전체 주문 목록 불러오기
  const fetchStoreOrders = async () => {
    try {
      // ⚠️ 주의: 백엔드에 사장님이 본인 가게 주문 리스트를 보는 API가 있어야 합니다.
      const response = await axios.get(
        `http://localhost:8080/api/owner/stores/${storeId}/orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // 페이징 처리된 데이터라면 response.data.content 일 수 있습니다.
      setOrders(response.data.content || response.data);
    } catch (error) {
      toast.error("주문 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreOrders();

    // (선택) 10초마다 새 주문이 있는지 자동 새로고침 (간단한 폴링 방식)
    const interval = setInterval(fetchStoreOrders, 10000);
    return () => clearInterval(interval);
  }, [storeId, token]);

  // 2. 주문 상태 변경 처리 함수 (백엔드 updateOrderStatus 호출)
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // 아까 확인한 백엔드의 updateOrderStatus PATCH API 호출
      await axios.patch(
        `http://localhost:8080/api/owner/orders/${orderId}/status`,
        { status: newStatus }, // 서버에서 String이나 Enum으로 받는 객체
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("주문 상태가 변경되었습니다!");
      fetchStoreOrders(); // 상태 변경 후 목록 다시 불러오기
    } catch (error) {
      toast.error(error.response?.data?.message || "상태 변경에 실패했습니다.");
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        주문 불러오는 중...
      </div>
    );

  // 상태별로 주문 분류
  const requestedOrders = orders.filter((o) => o.status === "REQUESTED");
  const acceptedOrders = orders.filter(
    (o) => o.status === "ACCEPTED" || o.status === "PREPARING"
  );
  const deliveringOrders = orders.filter((o) => o.status === "DELIVERING");

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2
        style={{
          borderBottom: "2px solid #333",
          paddingBottom: "10px",
          marginBottom: "20px",
        }}
      >
        👨‍🍳 실시간 주문 관리 대시보드
      </h2>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* 칼럼 1: 신규 접수 대기 */}
        <div style={columnStyle}>
          <h3 style={{ color: "#e74c3c" }}>
            🔔 신규 주문 ({requestedOrders.length})
          </h3>
          {requestedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              actionButton={
                <button
                  onClick={() => handleStatusChange(order.id, "ACCEPTED")}
                  style={btnStyle("#339af0")}
                >
                  주문 수락 (조리 시작)
                </button>
              }
              cancelButton={
                <button
                  onClick={() => handleStatusChange(order.id, "CANCELED")}
                  style={btnStyle("#e74c3c")}
                >
                  거절
                </button>
              }
            />
          ))}
        </div>

        {/* 칼럼 2: 조리 중 */}
        <div style={columnStyle}>
          <h3 style={{ color: "#f39c12" }}>
            🍳 조리 중 ({acceptedOrders.length})
          </h3>
          {acceptedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              actionButton={
                <button
                  onClick={() => handleStatusChange(order.id, "DELIVERING")}
                  style={btnStyle("#2ecc71")}
                >
                  조리 완료 (배달 시작)
                </button>
              }
            />
          ))}
        </div>

        {/* 칼럼 3: 배달 중 */}
        <div style={columnStyle}>
          <h3 style={{ color: "#2ecc71" }}>
            🛵 배달 중 ({deliveringOrders.length})
          </h3>
          {deliveringOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              actionButton={
                <button
                  onClick={() => handleStatusChange(order.id, "COMPLETED")}
                  style={btnStyle("#95a5a6")}
                >
                  배달 완료 처리
                </button>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// 개별 주문 카드 컴포넌트
const OrderCard = ({ order, actionButton, cancelButton }) => (
  <div
    style={{
      backgroundColor: "white",
      padding: "15px",
      borderRadius: "8px",
      marginBottom: "15px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "10px",
        borderBottom: "1px solid #eee",
        paddingBottom: "5px",
      }}
    >
      <strong>주문번호: #{order.id}</strong>
      <span style={{ fontSize: "0.85rem", color: "#888" }}>
        {new Date(order.requestedAt || order.orderDate).toLocaleTimeString()}
      </span>
    </div>

    <div style={{ marginBottom: "15px" }}>
      {order.orderItems?.map((item) => (
        <div key={item.id} style={{ fontSize: "0.95rem", marginBottom: "5px" }}>
          <span style={{ fontWeight: "bold" }}>
            {item.productName} x {item.quantity}
          </span>

          {/* ✅ 옵션이 있다면 사장님도 볼 수 있게 표시! */}
          {item.orderOptions && item.orderOptions.length > 0 && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "#666",
                paddingLeft: "10px",
              }}
            >
              {item.orderOptions.map((opt) => `└ ${opt.name}`).join(", ")}
            </div>
          )}
        </div>
      ))}
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontWeight: "bold",
      }}
    >
      <span>총 {order.totalPrice?.toLocaleString()}원</span>
      <div style={{ display: "flex", gap: "5px" }}>
        {cancelButton}
        {actionButton}
      </div>
    </div>
  </div>
);

// 스타일
const columnStyle = {
  flex: 1,
  backgroundColor: "#f8f9fa",
  padding: "15px",
  borderRadius: "10px",
  minHeight: "500px",
};

const btnStyle = (color) => ({
  backgroundColor: color,
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "0.9rem",
});

export default OwnerDashboard;
