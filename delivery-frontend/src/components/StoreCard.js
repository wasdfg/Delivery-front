import React from "react";
import "./StoreCard.css";
import { Link } from "react-router-dom"; // 👈 1. Link를 import 합니다.

// 2. props로 'id'를 받습니다.
function StoreCard({ id, name, rating, imageUrl }) {
  const numericRating = parseFloat(rating).toFixed(1);

  // 3. <div> 대신 <Link>를 사용하고, to={} 속성을 추가합니다.
  return (
    <Link to={`/store/${id}`} className="store-card">
      <img src={imageUrl} alt={name} className="store-image" />
      <div className="store-info">
        <h3 className="store-name">{name}</h3>
        <span className="store-rating">⭐ {numericRating}</span>
      </div>
    </Link>
  );
}

export default StoreCard;
