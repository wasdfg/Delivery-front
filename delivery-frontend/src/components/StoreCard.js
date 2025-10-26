import React from "react";
import "./StoreCard.css";

function StoreCard({ name, rating, imageUrl }) {
  const numericRating = parseFloat(rating).toFixed(1);

  return (
    <div className="store-card">
      <img src={imageUrl} alt={name} className="store-image" />
      <div className="store-info">
        <h3 className="store-name">{name}</h3>
        <span className="store-rating">⭐ {numericRating}</span>
      </div>
    </div>
  );
}

export default StoreCard;
