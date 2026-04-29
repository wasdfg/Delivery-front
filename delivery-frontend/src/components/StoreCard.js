import React from "react";
import "./StoreCard.css";
import { Link } from "react-router-dom";

// ✅ 1. 부모(StoreListPage)가 넘겨주는 deliveryFee, minOrderAmount Props 추가
function StoreCard({
  id,
  name,
  rating,
  imageUrl,
  isLiked,
  onToggleLike,
  deliveryFee,
  minOrderAmount,
}) {
  const numericRating = parseFloat(rating || 0).toFixed(1);

  const handleLikeClick = (e) => {
    e.preventDefault(); // Link 이동 방지
    e.stopPropagation(); // 상위 이벤트 전파 방지
    onToggleLike(id); // 부모에게 알림
  };

  return (
    <div className="store-card-wrapper" style={{ position: "relative" }}>
      {/* 찜하기(하트) 버튼 */}
      <button
        onClick={handleLikeClick}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 10,
          background: "rgba(255, 255, 255, 0.8)",
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

      {/* 가게 상세 페이지로 이동하는 Link */}
      <Link
        to={`/store/${id}`}
        className="store-card"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <img
          src={`http://localhost:8080${imageUrl}`}
          alt={name}
          className="store-image"
          style={{
            width: "100%",
            height: "150px",
            objectFit: "cover",
            borderRadius: "8px 8px 0 0",
          }} // 기본 이미지 스타일 방어코드
        />
        <div className="store-info" style={{ padding: "12px" }}>
          <h3
            className="store-name"
            style={{ margin: "0 0 8px 0", fontSize: "1.1rem" }}
          >
            {name}
          </h3>

          <div style={{ marginBottom: "8px" }}>
            <span
              className="store-rating"
              style={{ fontWeight: "bold", color: "#333" }}
            >
              ⭐ {numericRating}
            </span>
          </div>

          {/* ✅ 2. 최소주문금액 & 배달비 표시 영역 추가 */}
          <div
            className="store-price-info"
            style={{
              fontSize: "0.85rem",
              color: "#666",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span>
              최소주문 {minOrderAmount ? minOrderAmount.toLocaleString() : 0}원
            </span>
            <span>
              배달비{" "}
              {deliveryFee === 0
                ? "무료"
                : `${deliveryFee ? deliveryFee.toLocaleString() : 0}원`}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default StoreCard;
