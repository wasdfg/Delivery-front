import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { toast } from "react-toastify";

function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // 실시간 라이더 위치
  const [riderLocation, setRiderLocation] = useState(null);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/orders/${orderId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setOrder(response.data);
      } catch (error) {
        toast.error("주문 상세 정보를 불러오지 못했습니다.");
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId, token, navigate]);

  /**
   * WebSocket 연결
   * /topic/order/{orderId} 구독
   */
  useEffect(() => {
    if (!orderId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      debug: () => {},
      onConnect: () => {
        client.subscribe(`/topic/order/${orderId}`, (message) => {
          const body = JSON.parse(message.body);

          setRiderLocation({
            latitude: body.latitude,
            longitude: body.longitude,
          });
        });
      },
      onStompError: () => {
        toast.error("실시간 배송 추적 연결에 실패했습니다.");
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [orderId]);

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
      <h2 style={{ borderBottom: "2px solid #333", paddingBottom: "10px" }}>
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
          <span style={{ color: "#339af0", fontWeight: "bold" }}>
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

        {!riderLocation ? (
          <p style={{ color: "#666" }}>
            아직 라이더가 배차되지 않았거나 위치 정보가 없습니다.
          </p>
        ) : (
          <>
            <p>현재 라이더 위치가 실시간으로 업데이트되고 있습니다.</p>

            <div style={locationBoxStyle}>
              <p>
                위도 : <strong>{riderLocation.latitude}</strong>
              </p>
              <p>
                경도 : <strong>{riderLocation.longitude}</strong>
              </p>
            </div>

            {/*
              이후 단계
              카카오맵 / 네이버맵 지도 삽입 위치
            */}
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

        <div style={{ ...rowStyle, color: "#e74c3c" }}>
          <span>할인 금액</span>
          <span>-{order.discountAmount?.toLocaleString()}원</span>
        </div>

        <hr />

        <div style={{ ...rowStyle, fontSize: "1.2rem", fontWeight: "bold" }}>
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
