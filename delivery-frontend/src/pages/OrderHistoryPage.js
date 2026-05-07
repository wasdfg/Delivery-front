import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "./OrderHistoryPage.css";
import { useNavigate } from "react-router-dom";

// 백엔드 상태값을 한글 텍스트로 변환하기 위한 맵핑 객체
const STATUS_MAP = {
  PENDING: "접수 대기중",
  ACCEPTED: "조리중",
  DELIVERING: "배달중",
  COMPLETED: "배달 완료",
  CANCELED: "주문 취소",
};

function OrderHistoryPage() {
  const { token, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 리뷰 쓰기 페이지 이동
  const handleWriteReview = (orderId, storeId, storeName) => {
    navigate("/review/write", {
      state: { orderId, storeId, storeName },
    });
  };

  // 주문 취소 API 호출 (백엔드 cancelOrder 메서드 연동)
  const handleCancelOrder = async (orderId) => {
    const reason = prompt("주문 취소 사유를 입력해주세요. (예: 단순 변심)");
    if (!reason) return;

    try {
      await axios.post(
        `http://localhost:8080/api/orders/${orderId}/cancel`, // 백엔드 URL에 맞춰 수정 필요할 수 있음
        { reason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("주문이 성공적으로 취소되었습니다.");
      fetchOrders(); // 취소 후 목록 새로고침
    } catch (error) {
      alert(error.response?.data?.message || "주문 취소에 실패했습니다.");
    }
  };

  // 주문 내역 조회 API 호출
  const fetchOrders = async () => {
    try {
      setLoading(true);
      // 백엔드 OrderController의 내 주문 내역 조회 URL (예: /api/orders/my)
      const response = await axios.get("http://localhost:8080/api/orders/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 백엔드가 Page 객체로 반환하므로 배열은 content 안에 들어있습니다.
      setOrders(response.data.content || []);
    } catch (error) {
      console.error("주문 내역을 불러오는데 실패했습니다.", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    if (token) {
      fetchOrders();
    }
  }, [token, isLoggedIn, navigate]);

  if (loading) return <div>주문 내역을 불러오는 중...</div>;

  return (
    <div className="order-history-page">
      <h1>주문 내역</h1>

      {orders.length === 0 ? (
        <p>아직 주문한 내역이 없습니다.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            // DTO 필드명 orderId 적용
            <div key={order.orderId} className="order-card">
              <div className="order-header">
                <h3>{order.storeName || "가게 이름"}</h3>

                {/* CSS 클래스 동적 할당 및 한글 상태 표시 */}
                <span
                  className={`order-status status-${order.status.toLowerCase()}`}
                >
                  {STATUS_MAP[order.status] || order.status}
                </span>
              </div>

              <div className="order-date">
                {/* DTO 필드명 requestedAt 적용 */}
                {new Date(order.requestedAt).toLocaleString("ko-KR")}
              </div>

              <div className="order-items">
                {order.orderItems.map((item, idx) => (
                  // DTO 구조에 맞게 수정 (id가 없으면 idx 사용, 메뉴명은 productName)
                  <div key={idx} className="order-item-row">
                    <span>
                      {item.productName} x {item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <strong>
                  총 결제금액: {order.totalPrice?.toLocaleString("ko-KR")}원
                </strong>

                <div className="button-group">
                  {/* 접수 대기중일 때만 주문 취소 버튼 표시 */}
                  {order.status === "PENDING" && (
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancelOrder(order.orderId)}
                      style={{
                        marginRight: "10px",
                        backgroundColor: "#ff5252",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      ❌ 주문 취소
                    </button>
                  )}

                  {/* 배달 완료일 때만 리뷰 쓰기 버튼 표시 */}
                  {order.status === "COMPLETED" && (
                    <button
                      className="review-btn"
                      onClick={() =>
                        handleWriteReview(
                          order.orderId,
                          order.storeId,
                          order.storeName
                        )
                      }
                    >
                      ✍️ 리뷰 쓰기
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistoryPage;
