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

  // 데이터 로딩 통합 함수
  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [availableRes, myRes] = await Promise.all([
        axios.get("http://localhost:8080/api/deliveries/available", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:8080/api/deliveries/my", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setAvailableDeliveries(availableRes.data);
      setMyDeliveries(myRes.data);
    } catch (error) {
      toast.error("데이터 로딩 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // 💡 30초마다 자동 새로고침 (웹소켓 대신 간단한 폴링 방식)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // 배차 수락
  const handleAccept = async (deliveryId) => {
    try {
      await axios.patch(
        `http://localhost:8080/api/deliveries/${deliveryId}/assign`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.info("🛵 배차가 완료되었습니다. 안전 운전하세요!");
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "이미 다른 라이더가 수락한 배달입니다."
      );
    }
  };

  // 상태 변경 (PICKED_UP, DELIVERED)
  const handleStatusChange = async (deliveryId, newStatus) => {
    const statusText = newStatus === "PICKED_UP" ? "픽업" : "배달 완료";
    if (!window.confirm(`${statusText} 처리를 하시겠습니까?`)) return;

    try {
      await axios.patch(
        `http://localhost:8080/api/deliveries/${deliveryId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${statusText} 처리가 완료되었습니다.`);
      fetchData();
    } catch (error) {
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  if (loading) return <div className="loading">배달 목록 로딩 중...</div>;

  return (
    <div
      className="rider-page-container"
      style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}
    >
      <h1>🛵 라이더 전용 공간</h1>

      {/* --- 진행 중인 배달 --- */}
      <section style={sectionStyle}>
        <h3 style={{ color: "#e64980" }}>
          🔥 내가 진행 중인 배달 ({myDeliveries.length})
        </h3>
        {myDeliveries.length === 0 ? (
          <p style={emptyTextStyle}>현재 수행 중인 배달 임무가 없습니다.</p>
        ) : (
          myDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="order-card"
              style={activeCardStyle}
            >
              <div className="order-header">
                <strong>{delivery.storeName}</strong>
                <span className={`status-badge ${delivery.status}`}>
                  {delivery.status}
                </span>
              </div>
              <div className="order-body" style={{ margin: "10px 0" }}>
                <p>📍 도착지: {delivery.address}</p>
                <p>📞 연락처: {delivery.customerPhone || "정보 없음"}</p>
              </div>
              <div className="order-actions">
                {delivery.status === "ASSIGNED" && (
                  <button
                    onClick={() => handleStatusChange(delivery.id, "PICKED_UP")}
                    className="status-btn pick"
                  >
                    가게에서 픽업 완료
                  </button>
                )}
                {delivery.status === "PICKED_UP" && (
                  <button
                    onClick={() => handleStatusChange(delivery.id, "DELIVERED")}
                    className="status-btn finish"
                  >
                    고객에게 배달 완료
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {/* --- 배차 대기 목록 --- */}
      <section style={{ ...sectionStyle, marginTop: "40px" }}>
        <h3 style={{ color: "#228be6" }}>🆕 새로운 배달 콜</h3>
        {availableDeliveries.length === 0 ? (
          <p style={emptyTextStyle}>
            현재 대기 중인 콜이 없습니다. 잠시만 기다려주세요.
          </p>
        ) : (
          availableDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="order-card"
              style={waitingCardStyle}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{delivery.storeName}</strong>
                  <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    {delivery.address}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: "#228be6", fontWeight: "bold" }}>
                    {delivery.deliveryFee.toLocaleString()}원
                  </span>
                  <button
                    onClick={() => handleAccept(delivery.id)}
                    className="status-btn accept"
                    style={{ display: "block", marginTop: "5px" }}
                  >
                    수락
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// 스타일 헬퍼
const sectionStyle = { borderBottom: "1px solid #eee", paddingBottom: "20px" };
const emptyTextStyle = { color: "#999", textAlign: "center", padding: "20px" };
const activeCardStyle = {
  border: "2px solid #e64980",
  borderRadius: "10px",
  padding: "15px",
  marginBottom: "10px",
};
const waitingCardStyle = {
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "15px",
  marginBottom: "10px",
  backgroundColor: "#f8f9fa",
};

export default RiderPage;
