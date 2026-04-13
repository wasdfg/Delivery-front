import React from "react";

function OwnerOrderCard({ order, onStatusUpdate }) {
  // 현재 상태에 따라 보여줄 다음 단계 버튼 정의
  const getNextStep = (status) => {
    switch (status) {
      case "PENDING":
        return { label: "주문 수락", next: "ACCEPTED", color: "#28a745" };
      case "ACCEPTED":
        return { label: "조리 시작", next: "PREPARING", color: "#fd7e14" };
      case "PREPARING":
        return {
          label: "조리 완료",
          next: "READY_FOR_PICKUP",
          color: "#007bff",
        };
      case "READY_FOR_PICKUP":
        return { label: "배달 시작", next: "DELIVERING", color: "#6f42c1" };
      case "DELIVERING":
        return { label: "배달 완료", next: "COMPLETED", color: "#6c757d" };
      default:
        return null;
    }
  };

  const nextAction = getNextStep(order.status);

  return (
    <div style={cardStyle}>
      {/* 주문 기본 정보 */}
      <h3>주문 번호: {order.id}</h3>
      <p>메뉴: {order.menuName}</p>
      <p>
        현재 상태: <strong>{order.status}</strong>
      </p>

      {/* 🚀 상태 제어 버튼 영역 */}
      <div style={{ marginTop: "15px" }}>
        {/* 다음 단계로 넘어가는 메인 버튼 */}
        {nextAction && (
          <button
            onClick={() => onStatusUpdate(order.id, nextAction.next)}
            style={{
              ...btnStyle,
              backgroundColor: nextAction.color,
              color: "white",
            }}
          >
            {nextAction.label}
          </button>
        )}

        {/* 주문 수락 전이거나 조리 전일 때만 보이는 취소 버튼 */}
        {(order.status === "PENDING" || order.status === "ACCEPTED") && (
          <button
            onClick={() => onStatusUpdate(order.id, "CANCELED")}
            style={{
              ...btnStyle,
              backgroundColor: "#dc3545",
              color: "white",
              marginLeft: "10px",
            }}
          >
            주문 취소
          </button>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #ccc",
  padding: "15px",
  marginBottom: "10px",
  borderRadius: "8px",
};
const btnStyle = {
  padding: "8px 12px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
};

export default OwnerOrderCard;
