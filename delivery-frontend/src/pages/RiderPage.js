import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import "./OrderHistoryPage.css";
import ReportButton from "../components/ReportButton";

function RiderPage() {
  const { token } = useAuth();

  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  // 배송 실패 처리용
  const [failDeliveryId, setFailDeliveryId] = useState(null);
  const [failureReason, setFailureReason] = useState("");

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const [availableRes, myRes] = await Promise.all([
        axios.get(
          "http://localhost:8080/api/deliveries/available",
          authHeader,
        ),
        axios.get(
          "http://localhost:8080/api/deliveries/my",
          authHeader,
        ),
      ]);

      setAvailableDeliveries(
        availableRes.data.content || [],
      );

      setMyDeliveries(
        myRes.data.content || [],
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "배달 목록을 불러오는 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(
      fetchData,
      30000,
    );

    return () => clearInterval(interval);
  }, [token]);

  const handleAccept = async (deliveryId) => {
    const confirmed = window.confirm(
      "이 배달을 수락하시겠습니까?",
    );

    if (!confirmed) return;

    try {
      await axios.patch(
        `http://localhost:8080/api/deliveries/${deliveryId}/assign`,
        null,
        authHeader,
      );

      toast.success(
        "배달을 성공적으로 수락했습니다.",
      );

      fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "이미 다른 라이더가 접수한 주문입니다.",
      );
    }
  };

  const handleStatusChange = async (
    deliveryId,
    newStatus,
  ) => {
    const statusText =
      newStatus === "PICKED_UP"
        ? "픽업 완료"
        : newStatus === "DELIVERED"
          ? "배달 완료"
          : "상태 변경";

    const confirmed = window.confirm(
      `${statusText} 처리하시겠습니까?`,
    );

    if (!confirmed) return;

    try {
      await axios.patch(
        `http://localhost:8080/api/deliveries/${deliveryId}/status`,
        {
          status: newStatus,
        },
        authHeader,
      );

      toast.success(
        `${statusText} 처리되었습니다.`,
      );

      fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "상태 변경에 실패했습니다.",
      );
    }
  };

  // 실패 처리 시작
  const openFailModal = (deliveryId) => {
    setFailDeliveryId(deliveryId);
    setFailureReason("");
  };

  // 실패 처리 취소
  const closeFailModal = () => {
    setFailDeliveryId(null);
    setFailureReason("");
  };

  // 실패 처리
  const handleFailDelivery = async () => {
    if (!failDeliveryId) {
      return;
    }

    if (!failureReason) {
      toast.error(
        "배송 실패 사유를 선택해주세요.",
      );
      return;
    }

    const confirmed = window.confirm(
      "해당 배송을 실패 처리하시겠습니까?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.patch(
        `http://localhost:8080/api/deliveries/${failDeliveryId}/fail`,
        {
          reason: failureReason,
        },
        authHeader,
      );

      toast.success(
        "배송 실패 처리가 완료되었습니다.",
      );

      closeFailModal();
      fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "배송 실패 처리에 실패했습니다.",
      );
    }
  };

  const getFailureReasonName = (reason) => {
    const names = {
      CUSTOMER_ABSENT: "고객 부재",
      CONTACT_UNAVAILABLE: "연락 불가",
      INVALID_ADDRESS: "주소 오류",
      CUSTOMER_REFUSED: "수령 거부",
      OTHER: "기타",
    };

    return names[reason] || reason;
  };

  if (loading) {
    return (
      <div className="loading">
        배달 목록 로딩 중...
      </div>
    );
  }

  return (
    <div
      className="rider-page-container"
      style={{
        padding: "20px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <h1>🛵 라이더 전용 페이지</h1>

      <section style={sectionStyle}>
        <h2 style={{ color: "#e64980" }}>
          🔥 내가 진행 중인 배달 (
          {myDeliveries.length}
          )
        </h2>

        {myDeliveries.length === 0 ? (
          <p style={emptyTextStyle}>
            현재 진행 중인 배달이 없습니다.
          </p>
        ) : (
          myDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="order-card"
              style={activeCardStyle}
            >
              <div className="order-header">
                <strong>
                  {delivery.storeName ||
                    "가게 정보 없음"}
                </strong>

                <span
                  className={`status-badge ${delivery.status}`}
                >
                  {delivery.status}
                </span>
              </div>

              <div
                className="order-body"
                style={{ marginTop: "10px" }}
              >
                <p>
                  📍 주소:{" "}
                  {delivery.receiverAddress}
                </p>

                <p>
                  📞 연락처:{" "}
                  {delivery.receiverPhone ||
                    "정보 없음"}
                </p>

                <p>
                  📦 요청사항:{" "}
                  {delivery.itemDescription ||
                    "없음"}
                </p>

                {/* 실패 처리된 배송의 사유 */}
                {delivery.status === "FAILED" &&
                  delivery.failedReason && (
                    <p>
                      ❌ 실패 사유:{" "}
                      {getFailureReasonName(
                        delivery.failedReason,
                      )}
                    </p>
                  )}

                {delivery.status === "FAILED" &&
                  delivery.failedAt && (
                    <p>
                      실패 시간:{" "}
                      {new Date(
                        delivery.failedAt,
                      ).toLocaleString("ko-KR")}
                    </p>
                  )}
              </div>

              <div
                className="order-actions"
                style={{ marginTop: "15px" }}
              >
                {delivery.status === "ASSIGNED" && (
                  <button
                    className="status-btn pick"
                    onClick={() =>
                      handleStatusChange(
                        delivery.id,
                        "PICKED_UP",
                      )
                    }
                  >
                    가게 픽업 완료
                  </button>
                )}

                {delivery.status ===
                  "PICKED_UP" && (
                  <button
                    className="status-btn finish"
                    onClick={() =>
                      handleStatusChange(
                        delivery.id,
                        "DELIVERED",
                      )
                    }
                  >
                    고객 전달 완료
                  </button>
                )}

                {(delivery.status ===
                  "PICKED_UP" ||
                  delivery.status ===
                    "DELIVERING") && (
                  <button
                    type="button"
                    className="status-btn"
                    onClick={() =>
                      openFailModal(
                        delivery.id,
                      )
                    }
                  >
                    배송 실패
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      <section
        style={{
          ...sectionStyle,
          marginTop: "40px",
        }}
      >
        <h2 style={{ color: "#228be6" }}>
          🆕 배차 대기 목록
        </h2>

        {availableDeliveries.length === 0 ? (
          <p style={emptyTextStyle}>
            현재 대기 중인 배달이 없습니다.
          </p>
        ) : (
          availableDeliveries.map(
            (delivery) => (
              <div
                key={delivery.id}
                className="order-card"
                style={waitingCardStyle}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>
                      {delivery.storeName ||
                        "가게 정보 없음"}
                    </strong>

                    <p
                      style={{
                        marginTop: "6px",
                        color: "#666",
                      }}
                    >
                      📍{" "}
                      {
                        delivery.receiverAddress
                      }
                    </p>
                  </div>

                  <button
                    className="status-btn accept"
                    onClick={() =>
                      handleAccept(
                        delivery.id,
                      )
                    }
                  >
                    수락
                  </button>
                </div>
              </div>
            ),
          )}
        )}
      </section>

      {/* 배송 실패 처리 모달 */}
      {failDeliveryId && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h2>배송 실패 처리</h2>

            <p>
              배송 실패 사유를 선택해주세요.
            </p>

            <select
              value={failureReason}
              onChange={(e) =>
                setFailureReason(
                  e.target.value,
                )
              }
              style={selectStyle}
            >
              <option value="">
                실패 사유 선택
              </option>

              <option value="CUSTOMER_ABSENT">
                고객 부재
              </option>

              <option value="CONTACT_UNAVAILABLE">
                연락 불가
              </option>

              <option value="INVALID_ADDRESS">
                주소 오류
              </option>

              <option value="CUSTOMER_REFUSED">
                수령 거부
              </option>

              <option value="OTHER">
                기타
              </option>
            </select>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                type="button"
                onClick={closeFailModal}
              >
                취소
              </button>

              <button
                type="button"
                onClick={
                  handleFailDelivery
                }
              >
                실패 처리
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const sectionStyle = {
  marginBottom: "30px",
};

const emptyTextStyle = {
  color: "#888",
  textAlign: "center",
  padding: "30px",
};

const activeCardStyle = {
  marginBottom: "15px",
};

const waitingCardStyle = {
  marginBottom: "15px",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: "white",
  width: "400px",
  maxWidth: "90%",
  padding: "30px",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
};

const selectStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "10px",
};

export default RiderPage;