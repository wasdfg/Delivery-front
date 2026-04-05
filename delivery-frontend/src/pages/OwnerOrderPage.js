import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { toast } from "react-toastify";
import "./OrderHistoryPage.css";

function OwnerOrderPage() {
  const { storeId } = useParams();
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const stompClient = useRef(null);

  const fetchStoreOrders = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/stores/${storeId}/orders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(response.data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("로딩 실패", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreOrders();

    const socket = new SockJS("http://localhost:8080/ws");
    stompClient.current = Stomp.over(socket);
    stompClient.current.debug = null;

    stompClient.current.connect(
      {},
      () => {
        console.log(`📡 연결 성공: 가게 ${storeId}`);

        stompClient.current.subscribe(`/topic/store/${storeId}`, (message) => {
          const event = JSON.parse(message.body);

          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch(() => {});

          if (event.type === "ORDER_CREATED") {
            toast.info(`🔔 새 주문 #${event.orderId} 접수!`, {
              position: "top-right",
            });
            fetchStoreOrders();
          } else if (event.type === "REVIEW_CREATED") {
            toast.success(`⭐ 새 리뷰가 등록되었습니다!`);
          }
        });
      },
      (error) => {
        console.error("웹소켓 연결 에러:", error);
      }
    );

    return () => {
      if (stompClient.current) {
        stompClient.current.disconnect();
        console.log("📡 웹소켓 연결 해제");
      }
    };
  }, [storeId, token]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:8080/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`주문 상태가 [${newStatus}]로 변경되었습니다.`);
      fetchStoreOrders();
    } catch (error) {
      toast.error("상태 변경 실패");
    }
  };

  // ✅ 추가: 주문 취소 전용 핸들러 (사유 입력 포함)
  const handleCancelOrder = async (orderId) => {
    // 1. 사유 입력 창 띄우기
    const reason = window.prompt(
      "취소 사유를 입력해주세요. (예: 재료 소진, 배달 불가 등)"
    );

    // 2. 취소 버튼을 누르거나(null) 빈 값을 입력한 경우 예외 처리
    if (reason === null) return;
    if (reason.trim() === "") {
      toast.warn("취소 사유를 반드시 입력해야 합니다.");
      return;
    }

    try {
      // 3. 백엔드의 취소 전용 엔드포인트로 요청 전송 (reason 데이터 포함)
      await axios.patch(
        `http://localhost:8080/api/orders/${orderId}/cancel`,
        { reason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`주문이 취소되었습니다. (사유: ${reason})`);
      fetchStoreOrders(); // 목록 새로고침
    } catch (error) {
      console.error("취소 에러:", error);
      toast.error("주문 취소 처리에 실패했습니다.");
    }
  };

  if (loading)
    return <div className="loading-spinner">주문 목록을 불러오는 중...</div>;

  return (
    <div className="owner-order-page" style={{ padding: "20px" }}>
      <h2>🏪 가게 주문 관리</h2>

      <div className="order-grid" style={{ display: "grid", gap: "20px" }}>
        {orders.map((order) => (
          <div
            key={order.id}
            className="order-card"
            style={orderCardStyle(order.orderStatus)}
          >
            <div style={orderHeaderStyle}>
              <span className="order-num">주문번호 #{order.id}</span>
              <span className="order-time">
                {new Date(order.createdAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="customer-info" style={{ margin: "15px 0" }}>
              <strong>주문자:</strong> {order.userName} <br />
              <strong>주소:</strong> {order.address} <br />
              {order.request && (
                <div>
                  <strong>요청사항:</strong> {order.request}
                </div>
              )}
            </div>

            <div className="items-box" style={itemsBoxStyle}>
              {order.orderItems.map((item) => (
                <div
                  key={item.id}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>
                    {item.menuName} x {item.quantity}
                  </span>
                  <span>{(item.price * item.quantity).toLocaleString()}원</span>
                </div>
              ))}
            </div>

            <div
              style={{
                textAlign: "right",
                fontWeight: "bold",
                fontSize: "1.1rem",
                margin: "10px 0",
              }}
            >
              총합: {order.totalPrice.toLocaleString()}원
            </div>

            <div
              className="status-actions"
              style={{ display: "flex", gap: "5px" }}
            >
              <button
                disabled={order.orderStatus !== "PENDING"}
                onClick={() => handleStatusChange(order.id, "ACCEPTED")}
                style={btnStyle("#228be6")}
              >
                접수
              </button>
              <button
                disabled={order.orderStatus !== "ACCEPTED"}
                onClick={() => handleStatusChange(order.id, "DELIVERING")}
                style={btnStyle("#40c057")}
              >
                배달시작
              </button>
              <button
                disabled={order.orderStatus !== "DELIVERING"}
                onClick={() => handleStatusChange(order.id, "COMPLETED")}
                style={btnStyle("#868e96")}
              >
                완료
              </button>
              {/* ✅ 수정: 취소 버튼 클릭 시 handleCancelOrder 호출 */}
              <button
                disabled={["COMPLETED", "CANCELED"].includes(order.orderStatus)}
                onClick={() => handleCancelOrder(order.id)}
                style={btnStyle("#fa5252")}
              >
                취소
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 스타일 헬퍼
const orderCardStyle = (status) => ({
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "20px",
  backgroundColor: status === "PENDING" ? "#fff9db" : "#fff",
  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
});
const orderHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  borderBottom: "1px solid #eee",
  paddingBottom: "10px",
  fontWeight: "bold",
};
const itemsBoxStyle = {
  backgroundColor: "#f8f9fa",
  padding: "10px",
  borderRadius: "8px",
};
const btnStyle = (color) => ({
  flex: 1,
  padding: "10px",
  backgroundColor: color,
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
  opacity: 0.9,
});

export default OwnerOrderPage;
