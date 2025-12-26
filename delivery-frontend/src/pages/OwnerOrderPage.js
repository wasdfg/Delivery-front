import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./OrderHistoryPage.css";

// 👇 웹소켓 및 알림 라이브러리 추가
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { toast } from "react-toastify"; // (App.js에 ToastContainer가 있어야 작동)

function OwnerOrderPage() {
  const { storeId } = useParams();
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. 주문 목록 불러오기 (기존 동일)
  const fetchStoreOrders = async () => {
    try {
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

  // ✅ 2. 웹소켓 연결 및 실시간 감지 (추가된 부분)
  useEffect(() => {
    fetchStoreOrders(); // 최초 1회 로딩

    // 웹소켓 연결 시작
    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = Stomp.over(socket);

    // 개발 중엔 로그 너무 많이 뜨면 주석 처리
    // stompClient.debug = null;

    stompClient.connect({}, () => {
      console.log(`📡 사장님 웹소켓 연결됨: /topic/store/${storeId}`);

      // 구독: 우리 가게(storeId) 관련 소식 듣기
      stompClient.subscribe(`/topic/store/${storeId}`, (message) => {
        const event = JSON.parse(message.body);

        // (A) 새 주문 알림 (OrderCreatedEvent)
        // 백엔드 DTO에 storeId, orderId가 있고 newStatus가 없다고 가정
        if (event.orderId && !event.newStatus) {
          toast.info(`🔔 새 주문 #${event.orderId}이 들어왔습니다!`);
          fetchStoreOrders(); // ⭐ 화면 자동 갱신 (핵심!)
        }

        // (B) 새 리뷰 알림 (NewReviewEvent)
        else if (event.authorName) {
          toast.success(`⭐ ${event.authorName}님이 새 리뷰를 남겼습니다!`);
        }
      });
    });

    // 화면 나갈 때 연결 끊기
    return () => {
      if (stompClient.connected) stompClient.disconnect();
    };
  }, [storeId, token]); // storeId가 바뀔 때마다 재연결

  // 3. 상태 변경 핸들러 (기존 동일)
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:8080/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("상태가 변경되었습니다."); // alert -> toast로 변경 추천
      fetchStoreOrders();
    } catch (error) {
      console.error("상태 변경 실패", error);
      toast.error("상태 변경에 실패했습니다.");
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
