import React from "react";
import "./MenuCard.css"; // 👈 메뉴 카드용 CSS를 import
import { useCart } from "../contexts/CartContext";

function MenuCard({ product }) {
  // 3. 글로벌 장바구니에서 addToCart 함수를 가져옵니다.
  const { addToCart } = useCart();

  // 4. product 객체에서 필요한 정보를 분해합니다.
  const { name, price, description, imageUrl } = product;

  // 가격에 콤마(,)를 찍어줍니다
  const formattedPrice = price.toLocaleString("ko-KR");

  // 5. 클릭 시 addToCart 함수를 호출하는 핸들러
  const handleAddToCart = () => {
    // 'product' 객체 전체를 장바구니에 전달합니다.
    addToCart(product);
    alert(`${name}이(가) 장바구니에 담겼습니다.`); // 👈 사용자에게 알림
  };

  // 6. div에 onClick 이벤트를 추가합니다.
  return (
    <div className="menu-card" onClick={handleAddToCart}>
      <img
        src={`http://localhost:8080${imageUrl}`}
        alt={name}
        className="menu-image"
      />
      <div className="menu-info">
        <h4 className="menu-name">{name}</h4>
        <p className="menu-description">{description}</p>
        <div className="menu-price">{formattedPrice}원</div>
      </div>
    </div>
  );
}

export default MenuCard;
