import React from "react";
import "./MenuCard.css"; // 👈 메뉴 카드용 CSS를 import
import { useCart } from "../contexts/CartContext";

function MenuCard({ product }) {
  const isSoldOut = product.stock !== null && product.stock <= 0;
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
    <div
      className={`menu-card ${isSoldOut ? "sold-out" : ""}`}
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

        {/* ✅ 재고 수량 표시 로직 */}
        {product.stock !== null && (
          <p
            style={{ color: isSoldOut ? "red" : "#e67e22", fontWeight: "bold" }}
          >
            {isSoldOut ? "일시 품절" : `남은 수량: ${product.stock}개`}
          </p>
        )}
      </div>

      <button
        disabled={isSoldOut}
        style={{
          ...orderBtnStyle,
          backgroundColor: isSoldOut ? "#ccc" : "#ffc107",
          cursor: isSoldOut ? "not-allowed" : "pointer",
        }}
      >
        {isSoldOut ? "품절" : "담기"}
      </button>
    </div>
  );
}

const cardStyle = {
  display: "flex",
  borderBottom: "1px solid #eee",
  padding: "10px",
  alignItems: "center",
};
const imgStyle = {
  width: "80px",
  height: "80px",
  objectFit: "cover",
  marginRight: "15px",
};
const orderBtnStyle = {
  marginLeft: "auto",
  padding: "8px 15px",
  border: "none",
  borderRadius: "4px",
};

export default MenuCard;
