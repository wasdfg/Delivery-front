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
        axios.get("http://localhost:8080/api/deliveries/available", authHeader),
        axios.get("http://localhost:8080/api/deliveries/my", authHeader),
      ]);

      setAvailableDeliveries(availableRes.data.content || []);
      setMyDeliveries(myRes.data.content || []);
    } catch (error) {
      console.error(error);
      toast.error("배달 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [token]);

  /**
   * 배달 중일 때 자동 위치 전송
   *
   * PICKED_UP / DELIVERING 상태일 때만 전송
   */
  useEffect(() => {
    if (!token || !myDeliveries.length) {
      return;
    }

    const activeDelivery = myDeliveries.find(
      (delivery) =>
        delivery.status === "PICKED_UP" || delivery.status === "DELIVERING",
    );

    if (!activeDelivery) {
      return;
    }

    if (!activeDelivery.orderId) {
      console.error("위치 전송에 필요한 orderId가 없습니다.", activeDelivery);
      return;
    }

    const sendLocation = () => {
      if (!navigator.geolocation) {
        console.log("브라우저에서 위치 정보를 지원하지 않습니다.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const payload = {
            orderId: activeDelivery.orderId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          try {
            await axios.post(
              "http://localhost:8080/api/riders/location",
              payload,
              authHeader,
            );

            console.log("라이더 위치 전송 완료", payload);
          } catch (error) {
            console.error("라이더 위치 전송 실패:", error);
          }
        },
        (error) => {
          console.error("현재 위치를 가져오지 못했습니다.", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    };

    // 최초 1회 즉시 전송
    sendLocation();

    // 10초마다 위치 전송
    const locationInterval = setInterval(sendLocation, 10000);

    return () => {
      clearInterval(locationInterval);
    };
  }, [myDeliveries, token]);

  const handleAccept = async (deliveryId) => {
    const confirmed = window.confirm("이 배달을 수락하시겠습니까?");

    if (!confirmed) return;

    try {
      await axios.patch(
        `http://localhost:8080/api/deliveries/${deliveryId}/assign`,
        null,
        authHeader,
      );

      toast.success("배달을 성공적으로 수락했습니다.");

      fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "이미 다른 라이더가 접수한 주문입니다.",
      );
    }
  };

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
        {
          status: newStatus,
        },
        authHeader,
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

      {/* 
        현재 rider 객체가 이 페이지에 별도로 조회되지 않기 때문에
        기존 ReportButton의 targetId={rider.id}는 사용할 수 없습니다.
        라이더 신고 기능은 riderId를 확보한 뒤 연결하는 것이 맞습니다.
      */}

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

      <section
        style={{
          ...sectionStyle,
          marginTop: "40px",
        }}
      >
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

                  <p
                    style={{
                      marginTop: "6px",
                      color: "#666",
                    }}
                  >
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

export default RiderPage;
