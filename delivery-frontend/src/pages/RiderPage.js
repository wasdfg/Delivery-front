import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import "./OrderHistoryPage.css";

function RiderPage() {
  const { token } = useAuth();
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // 전체 데이터 조회
  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const [availableRes, myRes] = await Promise.all([
        axios.get("http://localhost:8080/api/deliveries/available", authHeader),
        axios.get("http://localhost:8080/api/deliveries/my", authHeader),
      ]);

      setAvailableDeliveries(availableRes.data || []);
      setMyDeliveries(myRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error("배달 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // 30초 폴링
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // 배달 수락
  const handleAccept = async (deliveryId) => {
    const confirmed = window.confirm("이 배달을 수락하시겠습니까?");
    if (!confirmed) return;

    try {
      await axios.patch(
        `http://localhost:8080/api/deliveries/${deliveryId}/assign`,
        null,
        authHeader
      );

      toast.success("배달을 성공적으로 수락했습니다.");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "이미 다른 라이더가 접수한 주문입니다."
      );
    }
  };

  // 배송 상태 변경
  const handleStatusChange = async (deliveryId, newStatus) => {
    const statusText =
      newStatus === "PICKED_UP"
        ? "픽업 완료"
        : newStatus === "DELIVERED"
        ? "배달 완료"
        : "상태 변경";

    const confirmed = window.confirm(`${statusText} 처리하시겠습니까?`);
    if (!confirmed) return;

    try {
      await axios.patch(
        `http://localhost:8080/api/deliveries/${deliveryId}/status`,
        { status: newStatus },
        authHeader
      );

      toast.success(`${statusText} 처리되었습니다.`);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "상태 변경에 실패했습니다.");
    }
  };

  if (loading) {
    return <div className="loading">배달 목록 로딩 중...</div>;
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

      {/* 진행 중인 배달 */}
      <section style={sectionStyle}>
        <h2 style={{ color: "#e64980" }}>
          🔥 내가 진행 중인 배달 ({myDeliveries.length})
        </h2>

        {myDeliveries.length === 0 ? (
          <p style={emptyTextStyle}>현재 진행 중인 배달이 없습니다.</p>
        ) : (
          myDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="order-card"
              style={activeCardStyle}
            >
              <div className="order-header">
                <strong>{delivery.storeName || "가게 정보 없음"}</strong>
                <span className={`status-badge ${delivery.status}`}>
                  {delivery.status}
                </span>
              </div>

              <div className="order-body" style={{ marginTop: "10px" }}>
                <p>📍 주소: {delivery.receiverAddress}</p>
                <p>📞 연락처: {delivery.receiverPhone || "정보 없음"}</p>
                <p>📦 요청사항: {delivery.itemDescription || "없음"}</p>
              </div>

              <div className="order-actions" style={{ marginTop: "15px" }}>
                {delivery.status === "ASSIGNED" && (
                  <button
                    className="status-btn pick"
                    onClick={() => handleStatusChange(delivery.id, "PICKED_UP")}
                  >
                    가게 픽업 완료
                  </button>
                )}

                {delivery.status === "PICKED_UP" && (
                  <button
                    className="status-btn finish"
                    onClick={() => handleStatusChange(delivery.id, "DELIVERED")}
                  >
                    고객 전달 완료
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {/* 대기 중인 배달 */}
      <section style={{ ...sectionStyle, marginTop: "40px" }}>
        <h2 style={{ color: "#228be6" }}>🆕 배차 대기 목록</h2>

        {availableDeliveries.length === 0 ? (
          <p style={emptyTextStyle}>현재 대기 중인 배달이 없습니다.</p>
        ) : (
          availableDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="order-card"
              style={waitingCardStyle}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{delivery.storeName || "가게 정보 없음"}</strong>
                  <p style={{ marginTop: "6px", color: "#666" }}>
                    📍 {delivery.receiverAddress}
                  </p>
                </div>

                <button
                  className="status-btn accept"
                  onClick={() => handleAccept(delivery.id)}
                >
                  수락
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

const sectionStyle = {
  borderBottom: "1px solid #eee",
  paddingBottom: "20px",
};

const emptyTextStyle = {
  color: "#999",
  textAlign: "center",
  padding: "20px",
};

const activeCardStyle = {
  border: "2px solid #e64980",
  borderRadius: "10px",
  padding: "15px",
  marginBottom: "12px",
};

const waitingCardStyle = {
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "15px",
  marginBottom: "12px",
  backgroundColor: "#f8f9fa",
};

export default RiderPage;
