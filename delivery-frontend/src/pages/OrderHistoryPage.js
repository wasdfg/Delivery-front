import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./OrderHistoryPage.css";

const API = "http://localhost:8080/api";

// 주문 상태
const STATUS_MAP = {
  PENDING: "접수 대기중",
  ACCEPTED: "조리중",
  WAITING_DELIVERY: "배달 대기",
  ASSIGNED: "라이더 배정",
  PICKED_UP: "픽업 완료",
  DELIVERING: "배달중",
  DELIVERED: "배달 완료",
  COMPLETED: "배달 완료",
  CANCELED: "주문 취소",
  FAILED: "주문 실패",
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

function OrderHistoryPage() {
  const { token, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingOrderId, setProcessingOrderId] = useState(null);

  // 1. 주문 내역 조회
  const fetchOrders = useCallback(
    async (showLoading = true) => {
      if (!token) return;

      try {
        if (showLoading) {
          setLoading(true);
        }

        const response = await axios.get(`${API}/orders/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrders(
          Array.isArray(response.data.content) ? response.data.content : [],
        );
      } catch (error) {
        console.error("주문 내역 조회 실패:", error);

        if (showLoading) {
          alert(
            error.response?.data?.message || "주문 내역을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [token],
  );

  useEffect(() => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    fetchOrders();
  }, [isLoggedIn, navigate, fetchOrders]);

  // 2. 결제 승인
  const handleApprovePayment = async (payment) => {
    if (!payment?.paymentId) {
      throw new Error("결제 정보를 찾을 수 없습니다.");
    }

    const response = await axios.post(
      `${API}/payments/${payment.paymentId}/approve`,
      {
        // Mock 결제용 값
        // 실제 PG 연동 시 PG에서 전달받은 paymentKey 사용
        paymentKey: "MOCK-REQUEST",

        // PG 주문번호
        orderId: payment.gatewayOrderId,

        // 서버에 저장된 결제 금액
        amount: Number(payment.amount),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const result = response.data;

    // 서버의 최신 주문 및 결제 상태 반영
    await fetchOrders(false);

    if (result.status === "APPROVED") {
      alert("결제가 성공적으로 완료되었습니다.");
    } else if (result.status === "FAILED") {
      alert("결제에 실패했습니다. 다시 결제해주세요.");
    } else {
      alert(PAYMENT_STATUS_MAP[result.status] || "결제 상태를 확인해주세요.");
    }

    return result;
  };

  // 3. 기존 READY 결제 이어하기
  const handleContinuePayment = async (order) => {
    if (processingOrderId !== null) return;

    const payment = order.latestPayment;

    if (!payment || payment.status !== "READY") {
      alert("진행 중인 결제 정보를 찾을 수 없습니다.");
      return;
    }

    if (!window.confirm("결제를 계속 진행하시겠습니까?")) {
      return;
    }

    setProcessingOrderId(order.orderId);

    try {
      await handleApprovePayment(payment);
    } catch (error) {
      console.error("결제 이어하기 실패:", error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "결제 결과를 확인할 수 없습니다.",
      );

      await fetchOrders(false);
    } finally {
      setProcessingOrderId(null);
    }
  };

  // 4. 기존 주문으로 재결제
  const handleRetryPayment = async (order) => {
    if (processingOrderId !== null) return;

    if (!window.confirm("해당 주문을 다시 결제하시겠습니까?")) {
      return;
    }

    setProcessingOrderId(order.orderId);

    try {
      // 기존 주문으로 새로운 결제 시도 생성
      const response = await axios.post(
        `${API}/payments/orders/${order.orderId}/retry`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const newPayment = response.data;

      // 새 결제 정보로 승인 요청
      await handleApprovePayment(newPayment);
    } catch (error) {
      console.error("재결제 실패:", error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "재결제 요청에 실패했습니다.",
      );

      await fetchOrders(false);
    } finally {
      setProcessingOrderId(null);
    }
  };

  // 5. 주문 취소
  const handleCancelOrder = async (orderId) => {
    if (processingOrderId !== null) return;

    const reason = window.prompt("주문 취소 사유를 입력해주세요.");

    if (!reason || !reason.trim()) {
      return;
    }

    if (!window.confirm("정말 주문을 취소하시겠습니까?")) {
      return;
    }

    setProcessingOrderId(orderId);

    try {
      // OrderController의 PATCH API 호출
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

      alert("주문이 취소되었습니다.");

      await fetchOrders(false);
    } catch (error) {
      console.error("주문 취소 실패:", error);

      alert(error.response?.data?.message || "주문 취소에 실패했습니다.");
    } finally {
      setProcessingOrderId(null);
    }
  };

  // 6. 리뷰 작성
  const handleWriteReview = (orderId, storeId, storeName) => {
    navigate("/review/write", {
      state: {
        orderId,
        storeId,
        storeName,
      },
    });
  };

  // 7. 로딩 화면
  if (loading) {
    return (
      <div className="order-history-page">
        <p>주문 내역을 불러오는 중...</p>
      </div>
    );
  }

  // 8. 주문 내역 화면
  return (
    <div className="order-history-page">
      <h1>주문 내역</h1>

      {orders.length === 0 ? (
        <p>아직 주문한 내역이 없습니다.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => {
            const payment = order.latestPayment;
            const paymentStatus = payment?.status;

            const isProcessing = processingOrderId === order.orderId;

            const canCancel =
              order.status === "PENDING" || order.status === "ACCEPTED";

            const canRetry =
              order.status === "PENDING" &&
              (paymentStatus === "FAILED" || paymentStatus === "CANCELED");

            const canContinue =
              order.status === "PENDING" && paymentStatus === "READY";

            return (
              <div key={order.orderId} className="order-card">
                {/* 주문 정보 */}
                <div className="order-header">
                  <h3>{order.storeName || "가게 이름"}</h3>

                  <span
                    className={`order-status status-${order.status?.toLowerCase()}`}
                  >
                    {STATUS_MAP[order.status] || order.status}
                  </span>
                </div>

                {/* 주문 날짜 */}
                <div className="order-date">
                  {order.requestedAt
                    ? new Date(order.requestedAt).toLocaleString("ko-KR")
                    : ""}
                </div>

                {/* 주문 상품 */}
                <div className="order-items">
                  {(order.orderItems || []).map((item, idx) => (
                    <div key={item.id ?? idx} className="order-item-row">
                      <span>
                        {item.productName} x {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 결제 정보 */}
                <div className="payment-info">
                  <div className="payment-info-row">
                    <span>결제 상태</span>

                    <strong
                      className={`payment-status payment-${paymentStatus?.toLowerCase() || "unknown"}`}
                    >
                      {paymentStatus
                        ? PAYMENT_STATUS_MAP[paymentStatus] || paymentStatus
                        : "결제 정보 없음"}
                    </strong>
                  </div>

                  {payment && (
                    <>
                      <div className="payment-info-row">
                        <span>결제 수단</span>

                        <span>
                          {PAYMENT_METHOD_MAP[payment.method] || payment.method}
                        </span>
                      </div>

                      <div className="payment-info-row">
                        <span>결제 금액</span>

                        <span>
                          {Number(payment.amount).toLocaleString("ko-KR")}원
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* 주문 금액 및 버튼 */}
                <div className="order-footer">
                  <strong>
                    총 결제금액:{" "}
                    {Number(order.totalPrice || 0).toLocaleString("ko-KR")}원
                  </strong>

                  <div className="button-group">
                    {/* 결제 이어하기 */}
                    {canContinue && (
                      <button
                        className="retry-payment-btn"
                        onClick={() => handleContinuePayment(order)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? "처리 중..." : "결제 이어하기"}
                      </button>
                    )}

                    {/* 재결제 */}
                    {canRetry && (
                      <button
                        className="retry-payment-btn"
                        onClick={() => handleRetryPayment(order)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? "처리 중..." : "다시 결제하기"}
                      </button>
                    )}

                    {/* 주문 취소 */}
                    {canCancel && (
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancelOrder(order.orderId)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? "처리 중..." : "주문 취소"}
                      </button>
                    )}

                    {/* 리뷰 작성 */}
                    {order.status === "COMPLETED" && (
                      <button
                        className="review-btn"
                        onClick={() =>
                          handleWriteReview(
                            order.orderId,
                            order.storeId,
                            order.storeName,
                          )
                        }
                      >
                        ✍️ 리뷰 쓰기
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderHistoryPage;
