import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import ReportButton from "../components/ReportButton";

function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // 현재 라이더 위치
  const [riderLocation, setRiderLocation] = useState(null);

  // 라이더 위치 조회 중인지 여부
  const [locationLoading, setLocationLoading] = useState(false);

  /*
   * 주문 상세 조회
   */
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/orders/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setOrder(response.data);
      } catch (error) {
        console.error(error);

        toast.error("주문 상세 정보를 불러오지 못했습니다.");
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId, token, navigate]);

  /*
   * 현재 라이더 위치 조회
   *
   * PICKED_UP / DELIVERING 상태일 때만 호출
   */
  useEffect(() => {
    if (!order) {
      return;
    }

    if (order.status !== "PICKED_UP" && order.status !== "DELIVERING") {
      setRiderLocation(null);
      return;
    }

    // 배송 ID가 어떤 형태로 내려와도 대응
    const deliveryId = order.deliveryId || order.delivery?.id;

    if (!deliveryId) {
      setRiderLocation(null);
      return;
    }

    let intervalId = null;
    let cancelled = false;

    const fetchRiderLocation = async () => {
      try {
        setLocationLoading(true);

        const response = await axios.get(
          `http://localhost:8080/api/deliveries/${deliveryId}/location`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!cancelled) {
          setRiderLocation({
            latitude: response.data.latitude,
            longitude: response.data.longitude,
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("라이더 위치 조회 실패:", error);

          /*
           * 위치가 아직 없거나 조회할 수 없는 상태라면
           * 기존 위치를 유지하지 않고 다시 조회할 수 있도록 처리
           */
          setRiderLocation(null);
        }
      } finally {
        if (!cancelled) {
          setLocationLoading(false);
        }
      }
    };

    // 최초 1회 바로 조회
    fetchRiderLocation();

    // 3초마다 조회
    intervalId = setInterval(() => {
      fetchRiderLocation();
    }, 3000);

    return () => {
      cancelled = true;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [order, token]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        주문 상세 로딩 중...
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        정보를 찾을 수 없습니다.
      </div>
    );
  }

  const isTracking =
    order.status === "PICKED_UP" || order.status === "DELIVERING";

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid #eee",
        borderRadius: "12px",
      }}
    >
      <ReportButton targetType="ORDER" targetId={order.id} />

      <h2
        style={{
          borderBottom: "2px solid #333",
          paddingBottom: "10px",
        }}
      >
        주문 상세 내역
      </h2>

      {/* 주문 기본 정보 */}
      <section style={sectionStyle}>
        <h3>{order.storeName}</h3>

        <p style={{ color: "#888" }}>
          주문 일시: {new Date(order.orderDate).toLocaleString()}
        </p>

        <p>주문 번호: {order.id}</p>

        <p>
          주문 상태 :
          <span
            style={{
              color: "#339af0",
              fontWeight: "bold",
            }}
          >
            {order.status}
          </span>
        </p>
      </section>

      {/* 실시간 배송 추적 */}
      <section
        style={{
          ...sectionStyle,
          backgroundColor: "#f8f9fa",
          padding: "20px",
          borderRadius: "10px",
        }}
      >
        <h3>🚚 실시간 배송 추적</h3>

        {!isTracking ? (
          <p style={{ color: "#666" }}>
            현재 배송 추적이 가능한 상태가 아닙니다.
          </p>
        ) : locationLoading && !riderLocation ? (
          <p style={{ color: "#666" }}>라이더 위치를 확인하는 중입니다...</p>
        ) : !riderLocation ? (
          <p style={{ color: "#666" }}>아직 라이더 위치 정보가 없습니다.</p>
        ) : (
          <>
            <p>현재 라이더 위치를 주기적으로 확인하고 있습니다.</p>

            <div style={locationBoxStyle}>
              <p>
                위도 : <strong>{riderLocation.latitude}</strong>
              </p>

              <p>
                경도 : <strong>{riderLocation.longitude}</strong>
              </p>
            </div>

            {/* 이후 지도 API 연결 */}
            <div style={mapPlaceholderStyle}>
              지도 영역 (Kakao Map 연결 예정)
            </div>
          </>
        )}
      </section>

      {/* 결제 정보 */}
      <section
        style={{
          ...sectionStyle,
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "8px",
        }}
      >
        <div style={rowStyle}>
          <span>주문 금액</span>
          <span>{order.itemTotal?.toLocaleString()}원</span>
        </div>

        <div style={rowStyle}>
          <span>배달팁</span>
          <span>+{order.deliveryFee?.toLocaleString()}원</span>
        </div>

        <div
          style={{
            ...rowStyle,
            color: "#e74c3c",
          }}
        >
          <span>할인 금액</span>
          <span>-{order.discountAmount?.toLocaleString()}원</span>
        </div>

        <hr />

        <div
          style={{
            ...rowStyle,
            fontSize: "1.2rem",
            fontWeight: "bold",
          }}
        >
          <span>총 결제금액</span>

          <span style={{ color: "#339af0" }}>
            {order.totalPrice?.toLocaleString()}원
          </span>
        </div>
      </section>

      <button onClick={() => navigate("/orders")} style={listBtnStyle}>
        주문 목록으로
      </button>
    </div>
  );
}

const sectionStyle = {
  marginBottom: "30px",
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
};

const listBtnStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "20px",
  backgroundColor: "white",
  border: "1px solid #ddd",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const locationBoxStyle = {
  backgroundColor: "white",
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "15px",
  marginTop: "10px",
};

const mapPlaceholderStyle = {
  marginTop: "20px",
  height: "300px",
  border: "1px dashed #bbb",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#777",
  backgroundColor: "white",
};

export default OrderDetailPage;
