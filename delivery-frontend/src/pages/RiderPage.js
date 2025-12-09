import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "./OrderHistoryPage.css"; // 스타일 재사용

function RiderPage() {
  const { token } = useAuth();
  const [availableDeliveries, setAvailableDeliveries] = useState([]); // 배차 대기 목록
  const [myDeliveries, setMyDeliveries] = useState([]); // 내 배달 목록
  const [loading, setLoading] = useState(true);

  // 1. 데이터 불러오기
  const fetchData = async () => {
    try {
      setLoading(true);
      // (1) 배차 대기 중인 목록 API (백엔드 구현 필요: GET /api/deliveries/available)
      const availableRes = await axios.get(
        "http://localhost:8080/api/deliveries/available",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAvailableDeliveries(availableRes.data);

      // (2) 내가 맡은 배달 목록 API (백엔드 구현 필요: GET /api/deliveries/my)
      const myRes = await axios.get("http://localhost:8080/api/deliveries/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyDeliveries(myRes.data);
    } catch (error) {
      console.error("데이터 로딩 실패", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // 2. 배달 수락 (배차 받기) 핸들러
  const handleAccept = async (deliveryId) => {
    try {
      // 이전에 구현하신 PATCH /api/delivery/{id}/assign API 호출
      await axios.patch(
        `http://localhost:8080/api/delivery/${deliveryId}/assign`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("배차되었습니다! 안전 운전하세요.");
      fetchData(); // 목록 새로고침
    } catch (error) {
      console.error("배차 실패", error);
      alert("배차에 실패했습니다.");
    }
  };

  // 3. 배달 상태 변경 핸들러 (픽업, 완료)
  const handleStatusChange = async (deliveryId, status) => {
    try {
      // 라이더 상태 변경 API 호출 (구현 필요)
      await axios.patch(
        `http://localhost:8080/api/delivery/${deliveryId}/status`,
        { status: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("상태가 변경되었습니다.");
      fetchData();
    } catch (error) {
      console.error("상태 변경 실패", error);
    }
  };

  if (loading) return <div>배달 목록을 불러오는 중...</div>;

  return (
    <div className="order-history-page">
      <h1>🛵 라이더 배달 관리</h1>

      {/* --- 섹션 1: 내가 배달 중인 목록 --- */}
      <h3 style={{ marginTop: "30px", color: "#e64980" }}>현재 배달 중</h3>
      {myDeliveries.length === 0 ? (
        <p>진행 중인 배달이 없습니다.</p>
      ) : (
        <div className="order-list">
          {myDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="order-card"
              style={{ borderLeft: "5px solid #e64980" }}
            >
              <div className="order-header">
                <h3>
                  {delivery.storeName} → {delivery.address}
                </h3>
                <span className="order-status">{delivery.status}</span>
              </div>
              <div className="order-footer" style={{ textAlign: "right" }}>
                {delivery.status === "ASSIGNED" && (
                  <button
                    className="status-btn deliver"
                    onClick={() => handleStatusChange(delivery.id, "PICKED_UP")}
                  >
                    픽업 완료
                  </button>
                )}
                {delivery.status === "PICKED_UP" && (
                  <button
                    className="status-btn complete"
                    onClick={() => handleStatusChange(delivery.id, "DELIVERED")}
                  >
                    배달 완료
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- 섹션 2: 배차 대기 목록 --- */}
      <h3 style={{ marginTop: "40px", color: "#228be6" }}>콜 대기 목록</h3>
      {availableDeliveries.length === 0 ? (
        <p>현재 대기 중인 콜이 없습니다.</p>
      ) : (
        <div className="order-list">
          {availableDeliveries.map((delivery) => (
            <div key={delivery.id} className="order-card">
              <div className="order-header">
                <h3>{delivery.storeName}</h3>
                <span className="order-status">대기중</span>
              </div>
              <div className="order-date">
                배달지: {delivery.address} <br />
                배달료: {delivery.deliveryFee.toLocaleString()}원
              </div>
              <div className="order-footer">
                <button
                  className="status-btn accept"
                  onClick={() => handleAccept(delivery.id)}
                >
                  배차 받기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RiderPage;
