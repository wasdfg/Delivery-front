import React from "react";
import "./StoreCard.css";
import { Link } from "react-router-dom"; // 👈 1. Link를 import 합니다.

// 2. props로 'id'를 받습니다.
function StoreCard({ id, name, rating, imageUrl, isLiked, onToggleLike }) {
  const numericRating = parseFloat(rating).toFixed(1);

  const handleLikeClick = (e) => {
    e.preventDefault(); // Link 이동 방지
    e.stopPropagation(); // 상위 이벤트 전파 방지
    onToggleLike(id); // 부모에게 알림
  };
  // 3. <div> 대신 <Link>를 사용하고, to={} 속성을 추가합니다.
  return (
    <div className="store-card-wrapper" style={{ position: "relative" }}>
      <button
        onClick={handleLikeClick}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 10,
          background: "rgba(255, 255, 255, 0.8)", // 배경 살짝 투명하게
          border: "none",
          borderRadius: "50%",
          width: "35px",
          height: "35px",
          fontSize: "1.2rem",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        }}
      >
        {isLiked ? "❤️" : "🤍"}
      </button>
      <Link to={`/store/${id}`} className="store-card">
        <img
          src={`http://localhost:8080${imageUrl}`}
          alt={name}
          className="store-image"
        />
        <div className="store-info">
          <h3 className="store-name">{name}</h3>
          <span className="store-rating">⭐ {numericRating}</span>
        </div>
      </Link>
    </div>
  );
}

export default StoreCard;
