import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { toast } from "react-toastify";

import "./OrderHistoryPage.css";

const API = "http://localhost:8080/api";

// 주문 상태
const ORDER_STATUS_MAP = {
  PENDING: "결제 대기",
  ACCEPTED: "주문 접수",
  DELIVERING: "배달 중",
  COMPLETED: "배달 완료",
  CANCELED: "주문 취소",
};

// 결제 상태
const PAYMENT_STATUS_MAP = {
  READY: "결제 대기",
  APPROVED: "결제 완료",
  FAILED: "결제 실패",
  CANCELED: "결제 시도 취소",
  REFUNDED: "환불 완료",
};

// 결제 수단
const PAYMENT_METHOD_MAP = {
  CARD: "카드",
  TRANSFER: "계좌이체",
  VIRTUAL_ACCOUNT: "가상계좌",
};

function OwnerOrderPage() {
  const { storeId } = useParams();
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingOrderId, setProcessingOrderId] = useState(null);

  const stompClient = useRef(null);

  // 1. 가게 주문 조회
  const fetchStoreOrders = useCallback(
    async (showLoading = true) => {
      if (!token || !storeId) return;

      try {
        if (showLoading) {
          setLoading(true);
        }

        const response = await axios.get(`${API}/stores/${storeId}/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Page 응답과 배열 응답 모두 처리
        const orderData = Array.isArray(response.data)
          ? response.data
          : response.data?.content || [];

        // 최신 주문이 먼저 보이도록 정렬
        const sortedOrders = [...orderData].sort((a, b) => {
          const dateA = new Date(a.requestedAt || a.createdAt || 0).getTime();

          const dateB = new Date(b.requestedAt || b.createdAt || 0).getTime();

          return dateB - dateA || (b.orderId || b.id) - (a.orderId || a.id);
        });

        setOrders(sortedOrders);
      } catch (error) {
        console.error("가게 주문 조회 실패:", error);

        if (showLoading) {
          toast.error(
            error.response?.data?.message || "주문 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [storeId, token],
  );

  // 2. 웹소켓 연결 및 신규 주문 알림
  useEffect(() => {
    if (!token || !storeId) return;

    fetchStoreOrders();

    const socket = new SockJS("http://localhost:8080/ws");

    const client = Stomp.over(socket);

    stompClient.current = client;
    client.debug = null;

    client.connect(
      {},
      () => {
        console.log(`가게 ${storeId} 웹소켓 연결 성공`);

        client.subscribe(`/topic/store/${storeId}`, (message) => {
          try {
            const event = JSON.parse(message.body);

            // 새 주문 알림
            if (event.type === "ORDER_CREATED") {
              const audio = new Audio("/sounds/notification.mp3");

              audio.play().catch(() => {});

              toast.info(`새 주문 #${event.orderId}이 접수되었습니다.`, {
                position: "top-right",
              });

              fetchStoreOrders(false);
            }

            // 새 리뷰 알림
            else if (event.type === "REVIEW_CREATED") {
              toast.success("새 리뷰가 등록되었습니다!");
            }

            // 주문 취소 이벤트가 발행되는 경우
            else if (event.type === "ORDER_CANCELED") {
              toast.info(`주문 #${event.orderId}이 취소되었습니다.`);

              fetchStoreOrders(false);
            }
          } catch (error) {
            console.error("웹소켓 메시지 처리 실패:", error);
          }
        });
      },
      (error) => {
        console.error("웹소켓 연결 에러:", error);
      },
    );

    return () => {
      if (stompClient.current === client) {
        if (client.connected) {
          client.disconnect();
        } else {
          socket.close();
        }

        stompClient.current = null;
      }
    };
  }, [storeId, token, fetchStoreOrders]);

  // 3. 주문 상태 변경
  const handleStatusChange = async (orderId, newStatus) => {
    if (processingOrderId !== null) return;

    setProcessingOrderId(orderId);

    try {
      await axios.patch(
        `${API}/orders/${orderId}/status`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(
        `주문 상태가 [${ORDER_STATUS_MAP[newStatus] || newStatus}]로 변경되었습니다.`,
      );

      await fetchStoreOrders(false);
    } catch (error) {
      console.error("주문 상태 변경 실패:", error);

      toast.error(
        error.response?.data?.message || "주문 상태 변경에 실패했습니다.",
      );
    } finally {
      setProcessingOrderId(null);
    }
  };

  // 4. 주문 취소
  const handleCancelOrder = async (orderId) => {
    if (processingOrderId !== null) return;

    const reason = window.prompt("주문 취소 사유를 입력해주세요.");

    if (reason === null) return;

    if (!reason.trim()) {
      toast.warn("취소 사유를 입력해주세요.");
      return;
    }

    if (!window.confirm("정말 주문을 취소하시겠습니까?")) {
      return;
    }

    setProcessingOrderId(orderId);

    try {
      await axios.patch(
        `${API}/orders/${orderId}/cancel`,
        {
          reason: reason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("주문이 취소되었습니다.");

      await fetchStoreOrders(false);
    } catch (error) {
      console.error("주문 취소 실패:", error);

      toast.error(error.response?.data?.message || "주문 취소에 실패했습니다.");
    } finally {
      setProcessingOrderId(null);
    }
  };

  // 5. 결제 상태에 따른 설명
  const getPaymentDescription = (paymentStatus) => {
    switch (paymentStatus) {
      case "READY":
        return "고객의 결제 진행을 기다리고 있습니다.";

      case "APPROVED":
        return "결제가 완료된 주문입니다.";

      case "FAILED":
        return "결제에 실패했습니다. 고객의 재결제를 기다려주세요.";

      case "CANCELED":
        return "결제 시도가 취소되었습니다.";

      case "REFUNDED":
        return "결제가 환불 완료되었습니다.";

      default:
        return "결제 정보가 없습니다.";
    }
  };

  // 6. 로딩 화면
  if (loading) {
    return <div className="loading-spinner">주문 목록을 불러오는 중...</div>;
  }

  // 7. 가게 주문 관리 화면
  return (
    <div className="owner-order-page">
      <h2>🏪 가게 주문 관리</h2>

      {orders.length === 0 ? (
        <div className="empty-order">등록된 주문이 없습니다.</div>
      ) : (
        <div className="order-grid">
          {orders.map((order) => {
            const orderId = order.orderId ?? order.id;
            const orderStatus = order.status ?? order.orderStatus;

            const payment = order.latestPayment;
            const paymentStatus = payment?.status;

            const isProcessing = processingOrderId === orderId;

            // 결제가 완료된 주문만 배달 시작 가능
            const canStartDelivery =
              orderStatus === "ACCEPTED" && paymentStatus === "APPROVED";

            // 배달 중인 주문만 완료 가능
            const canComplete = orderStatus === "DELIVERING";

            // 취소 가능 상태
            const canCancel = ["PENDING", "ACCEPTED"].includes(orderStatus);

            return (
              <div
                key={orderId}
                className={`order-card owner-order-card status-${orderStatus?.toLowerCase()}`}
              >
                {/* 주문 헤더 */}
                <div className="order-header">
                  <span className="order-num">주문번호 #{orderId}</span>

                  <span
                    className={`order-status status-${orderStatus?.toLowerCase()}`}
                  >
                    {ORDER_STATUS_MAP[orderStatus] || orderStatus}
                  </span>
                </div>

                {/* 주문 시간 및 고객 정보 */}
                <div className="customer-info">
                  <div>
                    <strong>주문 시간:</strong>{" "}
                    {order.requestedAt || order.createdAt
                      ? new Date(
                          order.requestedAt || order.createdAt,
                        ).toLocaleString("ko-KR")
                      : "-"}
                  </div>

                  {/* DTO에 고객 이름을 추가했을 때 표시 */}
                  {(order.userName || order.customerName) && (
                    <div>
                      <strong>주문자:</strong>{" "}
                      {order.userName || order.customerName}
                    </div>
                  )}

                  {/* DTO에 배송 주소를 추가했을 때 표시 */}
                  {(order.deliveryAddress || order.address) && (
                    <div>
                      <strong>배송 주소:</strong>{" "}
                      {order.deliveryAddress || order.address}
                    </div>
                  )}

                  {order.request && (
                    <div>
                      <strong>요청사항:</strong> {order.request}
                    </div>
                  )}
                </div>

                {/* 주문 상품 */}
                <div className="items-box">
                  {(order.orderItems || []).map((item, index) => {
                    const productName =
                      item.productName || item.menuName || item.name || "상품";

                    const quantity = Number(item.quantity || 0);

                    const price = Number(item.price || 0);

                    return (
                      <div key={item.id ?? index} className="owner-order-item">
                        <span>
                          {productName} x {quantity}
                        </span>

                        <span>
                          {(price * quantity).toLocaleString("ko-KR")}원
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 결제 정보 */}
                <div className="owner-payment-box">
                  <h4>결제 정보</h4>

                  <div className="payment-row">
                    <span>결제 상태</span>

                    <strong
                      className={`payment-status payment-${paymentStatus?.toLowerCase() || "unknown"}`}
                    >
                      {PAYMENT_STATUS_MAP[paymentStatus] || "결제 정보 없음"}
                    </strong>
                  </div>

                  {payment && (
                    <>
                      <div className="payment-row">
                        <span>결제 수단</span>

                        <span>
                          {PAYMENT_METHOD_MAP[payment.method] || payment.method}
                        </span>
                      </div>

                      <div className="payment-row">
                        <span>결제 금액</span>

                        <strong>
                          {Number(payment.amount || 0).toLocaleString("ko-KR")}
                          원
                        </strong>
                      </div>
                    </>
                  )}

                  <p className="payment-description">
                    {getPaymentDescription(paymentStatus)}
                  </p>
                </div>

                {/* 총 주문 금액 */}
                <div className="owner-order-total">
                  <span>총 주문 금액</span>

                  <strong>
                    {Number(order.totalPrice || 0).toLocaleString("ko-KR")}원
                  </strong>
                </div>

                {/* 주문 상태 변경 버튼 */}
                <div className="status-actions">
                  {/* 결제 성공 후 자동 접수되므로 기존 접수 버튼 제거 */}
                  {orderStatus === "PENDING" && (
                    <div className="waiting-payment-message">
                      {paymentStatus === "FAILED" ||
                      paymentStatus === "CANCELED"
                        ? "고객의 재결제를 기다리고 있습니다."
                        : "고객 결제가 완료되면 자동으로 주문이 접수됩니다."}
                    </div>
                  )}

                  {/* 결제 완료 후 배달 시작 */}
                  {canStartDelivery && (
                    <button
                      disabled={isProcessing}
                      onClick={() => handleStatusChange(orderId, "DELIVERING")}
                      className="owner-action-btn delivery-btn"
                    >
                      배달 시작
                    </button>
                  )}

                  {/* 배달 완료 */}
                  {canComplete && (
                    <button
                      disabled={isProcessing}
                      onClick={() => handleStatusChange(orderId, "COMPLETED")}
                      className="owner-action-btn complete-btn"
                    >
                      배달 완료
                    </button>
                  )}

                  {/* 주문 취소 */}
                  {canCancel && (
                    <button
                      disabled={isProcessing}
                      onClick={() => handleCancelOrder(orderId)}
                      className="owner-action-btn cancel-btn"
                    >
                      주문 취소
                    </button>
                  )}

                  {isProcessing && (
                    <span className="processing-message">처리 중...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 주문 카드 스타일
const orderCardStyle = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "20px",
  backgroundColor: "#fff",
  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
};

export default OwnerOrderPage;
