import React from "react";
import "./Header.css";
import { Link } from "react-router-dom"; // 👈 1. <Link> import
import { useCart } from "../contexts/CartContext"; // 👈 2. useCart 훅 import
import { useAuth } from "../contexts/AuthContext";

function Header() {
  // 3. 글로벌 장바구니 state에 접근
  const { cartItems } = useCart();

  // 4. 장바구니에 담긴 총 아이템 개수 계산 (수량(quantity) 기준)
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const handleLogout = () => {
    logout(); // 👈 AuthContext의 logout 함수 호출
    navigate("/"); // 👈 로그아웃 후 홈으로 이동
    // (필요시 장바구니도 비우는 로직 추가)
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* 5. 로고를 클릭하면 홈('/')으로 이동하는 <Link>로 변경 */}
        <Link to="/" className="logo">
          DeliveryApp
        </Link>

        <nav>
          {isLoggedIn ? (
            <>
              <Link to="/mypage" className="nav-link">
                마이페이지
              </Link>
              <Link to="/orders" className="nav-link">
                주문 내역
              </Link>
              <Link to="/cart" className="nav-link">
                {/* 여기에 FontAwesome 같은 아이콘을 넣으면 더 좋습니다 */}
                🛒 장바구니
                {/* 7. 총 개수가 0보다 크면 배지 표시 */}
                {totalItems > 0 && (
                  <span className="cart-badge">{totalItems}</span>
                )}
              </Link>
              // 로그인 상태일 때 "로그아웃" 버튼 표시
              <button onClick={handleLogout} className="nav-link-button">
                로그아웃
              </button>
            </>
          ) : (
            // 로그아웃 상태일 때 "로그인" 링크 표시
            <Link to="/login" className="nav-link">
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
