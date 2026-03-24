import React, { useState, useEffect } from "react";
import "./Header.css";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios"; // axios 추가

function Header() {
  const navigate = useNavigate();
  const { isLoggedIn, logout, user } = useAuth(); // user 정보 추가 추출
  const { cartItems } = useCart();

  // ✅ 알림 관련 상태 추가
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // 1. 안 읽은 알림 개수 가져오기 함수
  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get("/api/notifications/unread-count");
      setUnreadCount(res.data);
    } catch (err) {
      console.error("알림 개수 조회 실패:", err);
    }
  };

  // 2. 알림 목록 가져오기 함수
  const fetchNotifications = async () => {
    try {
      const res = await axios.get("/api/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("알림 목록 조회 실패:", err);
    }
  };

  // ✅ 실시간 이벤트 리스너 등록 (App.js에서 던진 신호 받기)
  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadCount(); // 초기 로딩 시 호출

      const handleUpdateNoti = () => {
        fetchUnreadCount(); // 실시간 알림 수신 시 다시 호출
      };

      window.addEventListener("updateUnreadCount", handleUpdateNoti);
      return () =>
        window.removeEventListener("updateUnreadCount", handleUpdateNoti);
    }
  }, [isLoggedIn]);

  // 3. 알림 아이콘 클릭 핸들러
  const toggleNotiDropdown = () => {
    const nextState = !isNotiOpen;
    setIsNotiOpen(nextState);
    if (nextState) fetchNotifications(); // 열릴 때 목록 새로고침
  };

  // 4. 알림 클릭 시 (읽음 처리 + 이동)
  const handleNotiClick = async (noti) => {
    try {
      if (!noti.isRead) {
        await axios.patch(`/api/notifications/${noti.id}/read`);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setIsNotiOpen(false);
      navigate(noti.targetUrl);
    } catch (err) {
      console.error("알림 읽음 처리 실패:", err);
    }
  };

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
              {/* ✅ 알림 종 아이콘 추가 */}
              <div
                className="nav-item-wrapper"
                style={{ position: "relative" }}
              >
                <button
                  onClick={toggleNotiDropdown}
                  className="nav-link-button bell-btn"
                >
                  🔔{" "}
                  {unreadCount > 0 && (
                    <span className="noti-badge">{unreadCount}</span>
                  )}
                </button>

                {/* 알림 드롭다운 UI */}
                {isNotiOpen && (
                  <div className="noti-dropdown">
                    <div className="noti-header">최근 알림</div>
                    <div className="noti-list">
                      {notifications.length === 0 ? (
                        <div className="noti-empty">
                          새로운 알림이 없습니다.
                        </div>
                      ) : (
                        notifications.map((noti) => (
                          <div
                            key={noti.id}
                            className={`noti-item ${
                              noti.isRead ? "read" : "unread"
                            }`}
                            onClick={() => handleNotiClick(noti)}
                          >
                            <p className="noti-content">{noti.content}</p>
                            <span className="noti-date">
                              {new Date(noti.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
