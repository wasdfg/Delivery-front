import React from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext"; // 👈 장바구니 훅 추가

function MenuCard({ product, onUpdate }) {
  const { user, token } = useAuth();
  const { addToCart } = useCart(); // 👈 장바구니 담기 함수 가져오기

  const isAvailable = product.available;
  // 권한 체크: 프로젝트 공통 규격인 "STORE_OWNER"로 확인 권장
  const isOwner = user?.role === "STORE_OWNER";

  // 사장님용: 품절 상태 토글
  const handleToggle = async (e) => {
    e.stopPropagation(); // 카드 전체 클릭 이벤트 방지
    try {
      await axios.patch(
        `http://localhost:8080/api/products/${product.id}/status`, // 경로 확인 필요
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onUpdate) onUpdate();
    } catch (error) {
      alert("상태 변경에 실패했습니다.");
    }
  };

  // 손님용: 장바구니 담기
  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart(product); // CartContext의 함수 호출
    alert(`${product.name}이 장바구니에 담겼습니다.`);
  };

  return (
    <div
      className={`menu-card ${!isAvailable ? "sold-out" : ""}`}
      style={{
        ...cardStyle,
        opacity: isAvailable ? 1 : 0.6, // 품절 시 전체적으로 흐리게
        filter: isAvailable ? "none" : "grayscale(50%)",
      }}
    >
      <img
        src={`http://localhost:8080${product.imageUrl}`}
        alt={product.name}
        style={imgStyle}
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/100";
        }} // 이미지 로딩 실패 대비
      />

      <div className="info" style={{ flex: 1, marginLeft: "15px" }}>
        <h3 style={{ margin: "0 0 5px 0" }}>{product.name}</h3>
        <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>
          {product.price.toLocaleString()}원
        </p>

        <span
          style={{
            fontSize: "0.75rem",
            padding: "3px 10px",
            borderRadius: "12px",
            backgroundColor: isAvailable ? "#e3f2fd" : "#f5f5f5",
            color: isAvailable ? "#1976d2" : "#9e9e9e",
            border: `1px solid ${isAvailable ? "#bbdefb" : "#e0e0e0"}`,
          }}
        >
          {isAvailable ? "판매 중" : "일시 품절"}
        </span>
      </div>

      <div
        className="actions"
        style={{ display: "flex", flexDirection: "column", gap: "5px" }}
      >
        {isOwner && (
          <button onClick={handleToggle} style={adminBtnStyle}>
            {isAvailable ? "품절 처리" : "판매 재개"}
          </button>
        )}

        <button
          disabled={!isAvailable}
          onClick={handleAddToCart} // 👈 클릭 이벤트 연결
          style={orderBtnStyle(isAvailable)}
        >
          {isAvailable ? "담기" : "품절"}
        </button>
      </div>
    </div>
  );
}

// 스타일 가이드 (예시)
const cardStyle = {
  display: "flex",
  padding: "15px",
  borderBottom: "1px solid #eee",
  alignItems: "center",
};
const imgStyle = {
  width: "80px",
  height: "80px",
  borderRadius: "8px",
  objectFit: "cover",
};
const adminBtnStyle = {
  padding: "5px 10px",
  fontSize: "0.8rem",
  backgroundColor: "#666",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
const orderBtnStyle = (isAvailable) => ({
  padding: "8px 15px",
  backgroundColor: isAvailable ? "#ff5252" : "#ccc",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: isAvailable ? "pointer" : "not-allowed",
  fontWeight: "bold",
});

export default MenuCard;
