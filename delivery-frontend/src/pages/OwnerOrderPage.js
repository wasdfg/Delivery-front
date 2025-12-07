import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./OrderHistoryPage.css"; // 주문 내역 CSS 재사용

function OwnerOrderPage() {
  const { storeId } = useParams();
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. 가게에 들어온 주문 목록 불러오기
  const fetchStoreOrders = async () => {
    try {
      // 백엔드 API 확인 필요: GET /api/stores/{storeId}/orders
      const response = await axios.get(
        `http://localhost:8080/api/stores/${storeId}/orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(response.data);
    } catch (error) {
      console.error("주문 목록 로딩 실패", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStoreOrders();
  }, [storeId, token]);

  // 2. 주문 상태 변경 핸들러
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // 백엔드 API 확인 필요: PATCH /api/orders/{orderId}/status
      // Body: { status: "ACCEPTED" } 혹은 쿼리 파라미터 등 백엔드 스펙에 맞춤
      await axios.patch(
        `http://localhost:8080/api/orders/${orderId}/status`,
        { status: newStatus }, // DTO 필드명 확인 (status 또는 orderStatus)
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("상태가 변경되었습니다.");
      fetchStoreOrders(); // 목록 새로고침
    } catch (error) {
      console.error("상태 변경 실패", error);
      alert("상태 변경에 실패했습니다.");
    }
  };

  if (loading) return <div>주문 내역을 불러오는 중...</div>;

  return (
    <div className="order-history-page">
      <h1>사장님 주문 관리</h1>

      {orders.length === 0 ? (
        <p>들어온 주문이 없습니다.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <div
              key={order.id}
              className="order-card"
              style={{ borderColor: "#339af0" }}
            >
              <div className="order-header">
                <h3>주문번호 #{order.id}</h3>
                <span className={`order-status status-${order.orderStatus}`}>
                  {order.orderStatus}
                </span>
              </div>

              <div className="order-date">
                {/* 주문자 정보가 DTO에 있다면 표시 (예: order.userName, order.address) */}
                주문자: {order.userName || "손님"} <br />
                주소: {order.address || "주소 정보 없음"}
              </div>

              <div className="order-items">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="order-item-row">
                    - {item.menuName} x {item.quantity}
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div style={{ marginBottom: "10px" }}>
                  <strong>
                    합계: {order.totalPrice.toLocaleString("ko-KR")}원
                  </strong>
                </div>

                {/* 3. 상태 변경 버튼들 (현재 상태에 따라 다르게 보여줄 수도 있음) */}
                <div className="owner-actions">
                  <button
                    onClick={() => handleStatusChange(order.id, "ACCEPTED")}
                    className="status-btn accept"
                  >
                    접수
                  </button>
                  <button
                    onClick={() => handleStatusChange(order.id, "DELIVERING")}
                    className="status-btn deliver"
                  >
                    배달중
                  </button>
                  <button
                    onClick={() => handleStatusChange(order.id, "COMPLETED")}
                    className="status-btn complete"
                  >
                    완료
                  </button>
                  <button
                    onClick={() => handleStatusChange(order.id, "CANCELED")}
                    className="status-btn cancel"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OwnerOrderPage;
