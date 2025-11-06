import React from "react";
import "./MenuCard.css"; // 👈 메뉴 카드용 CSS를 import

// 메뉴 이름, 가격, 설명, 이미지 URL을 props로 받습니다.
function MenuCard({ name, price, description, imageUrl }) {
  // 가격에 콤마(,)를 찍어줍니다 (예: 18000 -> 18,000)
  const formattedPrice = price.toLocaleString("ko-KR");

  return (
    <div className="menu-card">
      <img src={imageUrl} alt={name} className="menu-image" />
      <div className="menu-info">
        <h4 className="menu-name">{name}</h4>
        <p className="menu-description">{description}</p>
        <div className="menu-price">{formattedPrice}원</div>
      </div>
    </div>
  );
}

export default MenuCard;
