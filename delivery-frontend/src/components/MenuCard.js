import React from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

function MenuCard({ product, onUpdate }) {
  const { user, token } = useAuth();

  // 서버 엔티티의 isAvailable 필드가 DTO에서 available로 올 경우
  const isAvailable = product.available;
  const isOwner = user?.role === "OWNER";

  const handleToggle = async () => {
    try {
      await axios.patch(
        `http://localhost:8080/api/products/${product.id}/toggle-availability`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onUpdate) onUpdate(); // 부모의 fetchData 호출하여 리스트 갱신
    } catch (error) {
      alert("상태 변경에 실패했습니다.");
    }
  };

  return (
    <div
      className={`menu-card ${!isAvailable ? "sold-out" : ""}`}
      style={cardStyle}
    >
      <img
        src={`http://localhost:8080${product.imageUrl}`}
        alt={product.name}
        style={imgStyle}
      />

      <div className="info">
        <h3>{product.name}</h3>
        <p>{product.price.toLocaleString()}원</p>

        {/* ✅ 상태 뱃지 표시 */}
        <span
          style={{
            fontSize: "0.8rem",
            padding: "2px 8px",
            borderRadius: "12px",
            backgroundColor: isAvailable ? "#e3f2fd" : "#ffebee",
            color: isAvailable ? "#1976d2" : "#c62828",
          }}
        >
          {isAvailable ? "판매 중" : "일시 품절"}
        </span>
      </div>

      <div
        className="actions"
        style={{ marginLeft: "auto", display: "flex", gap: "8px" }}
      >
        {/* 사장님용 관리 버튼 */}
        {isOwner && (
          <button onClick={handleToggle} style={adminBtnStyle}>
            {isAvailable ? "품절로 변경" : "판매로 변경"}
          </button>
        )}

        {/* 손님용 주문 버튼 */}
        <button disabled={!isAvailable} style={orderBtnStyle(isAvailable)}>
          {isAvailable ? "담기" : "품절"}
        </button>
      </div>
    </div>
  );
}

// ... 스타일 객체들은 기존과 유사
export default MenuCard;
