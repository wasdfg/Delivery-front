import React from "react";
import "./Header.css";
import { Link } from "react-router-dom"; // 👈 1. <Link> import
import { useCart } from "../contexts/CartContext"; // 👈 2. useCart 훅 import

function Header() {
  // 3. 글로벌 장바구니 state에 접근
  const { cartItems } = useCart();

  // 4. 장바구니에 담긴 총 아이템 개수 계산 (수량(quantity) 기준)
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <header className="header">
      <div className="header-container">
        {/* 5. 로고를 클릭하면 홈('/')으로 이동하는 <Link>로 변경 */}
        <Link to="/" className="logo">
          DeliveryApp
        </Link>

        <nav>
          {/* 6. "장바구니" 링크/아이콘 추가 */}
          <Link to="/cart" className="nav-link">
            {/* 여기에 FontAwesome 같은 아이콘을 넣으면 더 좋습니다 */}
            🛒 장바구니
            {/* 7. 총 개수가 0보다 크면 배지 표시 */}
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
          <Link to="/login" className="nav-link">
            로그인
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
