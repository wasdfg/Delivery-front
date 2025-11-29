import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext"; // 토큰 필요
import "./OrderHistoryPage.css"; // 스타일 파일 (다음 단계에서 생성)
import { useNavigate } from "react-router-dom";

function OrderHistoryPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleWriteReview = (orderId, storeId, storeName) => {
    // navigate의 두 번째 인자(state)로 데이터를 넘겨주면,
    // 이동한 페이지에서 useLocation()으로 받을 수 있습니다.
    navigate("/review/write", {
      state: { orderId, storeId, storeName },
    });
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // 1. 백엔드 주문 내역 조회 API 호출 (GET)
        // (API 주소는 백엔드 컨트롤러에 따라 다를 수 있으니 확인 필요: 예: /api/orders 또는 /api/users/orders)
        const response = await axios.get("http://localhost:8080/api/orders", {
          headers: {
            Authorization: `Bearer ${token}`, // 인증 토큰 필수
          },
        });

        // 2. 가져온 주문 목록을 state에 저장 (최신순 정렬이 안 되어있다면 여기서 sort)
        setOrders(response.data);
      } catch (error) {
        console.error("주문 내역을 불러오는데 실패했습니다.", error);
      }
      setLoading(false);
    };

    if (token) {
      fetchOrders();
    }
  }, [token]);

  if (loading) return <div>주문 내역을 불러오는 중...</div>;

  return (
    <div className="order-history-page">
      <h1>주문 내역</h1>

      {orders.length === 0 ? (
        <p>아직 주문한 내역이 없습니다.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                {/* 가게 이름 (백엔드 DTO에 storeName이 있다고 가정) */}
                <h3>{order.storeName || "가게 이름"}</h3>
                <span className={`order-status status-${order.orderStatus}`}>
                  {order.orderStatus} {/* 예: PENDING, DELIVERING, COMPLETED */}
                </span>
              </div>

              <div className="order-date">
                {/* 날짜 포맷팅 */}
                {new Date(order.orderedAt).toLocaleString("ko-KR")}
              </div>

              <div className="order-items">
                {/* 주문한 메뉴 요약 표시 (예: 후라이드 치킨 외 2개) */}
                {order.orderItems.map((item) => (
                  <div key={item.id} className="order-item-row">
                    <span>
                      {item.menuName} x {item.quantity}
                    </span>
                    {/* 가격 정보가 있다면 표시 */}
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <strong>
                  총 결제금액: {order.totalPrice.toLocaleString("ko-KR")}원
                </strong>

                <button
                  className="review-btn"
                  onClick={() =>
                    handleWriteReview(order.id, order.storeId, order.storeName)
                  }
                >
                  ✍️ 리뷰 쓰기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistoryPage;
