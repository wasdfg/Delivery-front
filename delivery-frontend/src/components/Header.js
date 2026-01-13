import React from "react";
import "./Header.css";
import { Link, useNavigate } from "react-router-dom"; // 👈 useNavigate 추가
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

function Header() {
  const navigate = useNavigate(); // 👈 선언 필요

  // 1. AuthContext에서 필요한 정보 꺼내기
  // logout과 isLoggedIn이 AuthContext에 정의되어 있다고 가정합니다.
  const { isLoggedIn, logout } = useAuth();

  // 2. 장바구니 데이터 접근
  const { cartItems } = useCart();

  // 3. 총 수량 계산
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="header">
      <div className="header-container">
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
                🛒 장바구니
                {totalItems > 0 && (
                  <span className="cart-badge">{totalItems}</span>
                )}
              </Link>
              {/* JSX 내부 주석은 이 형식을 사용해야 에러가 나지 않습니다 */}
              <button onClick={handleLogout} className="nav-link-button">
                로그아웃
              </button>
            </>
          ) : (
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
