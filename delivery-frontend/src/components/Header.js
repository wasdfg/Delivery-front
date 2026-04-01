import React, { useState, useEffect } from "react";
import "./Header.css";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

function Header() {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();
  const { cartItems } = useCart();

  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // ✅ 추가: 현재 삭제 애니메이션이 진행 중인 알림 ID들을 보관
  const [deletingIds, setDeletingIds] = useState([]);

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get("/api/notifications/unread-count");
      setUnreadCount(res.data);
    } catch (err) {
      console.error("알림 개수 조회 실패:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("/api/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("알림 목록 조회 실패:", err);
    }
  };

  const handleReadAll = async () => {
    try {
      await axios.patch("/api/notifications/read-all");

      setNotifications((prev) =>
        prev.map((noti) => ({ ...noti, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("전체 읽음 처리 실패:", err);
      alert("알림 읽음 처리에 실패했습니다.");
    }
  };

  // ✅ 수정: 슬라이드 모션이 적용된 개별 삭제 함수
  const handleDelete = async (e, notiId) => {
    e.stopPropagation(); // 알림 클릭 이벤트(페이지 이동)가 실행되지 않도록 막음
    try {
      // 1. 서버에 삭제 요청
      await axios.delete(`/api/notifications/${notiId}`);

      // 2. 해당 알림을 '삭제 중' 상태로 만들어 애니메이션(클래스) 트리거
      setDeletingIds((prev) => [...prev, notiId]);

      // 3. 400ms(애니메이션 시간) 대기 후, 실제로 리스트에서 제거
      setTimeout(() => {
        setNotifications((prev) => prev.filter((noti) => noti.id !== notiId));
        setDeletingIds((prev) => prev.filter((id) => id !== notiId)); // 상태 정리

        // 만약 안 읽은 알림을 지웠다면 숫자도 1 감소시킴
        const deletedNoti = notifications.find((n) => n.id === notiId);
        if (deletedNoti && !deletedNoti.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }, 400); // CSS의 transition 시간(0.4초)과 맞춰주세요.
    } catch (err) {
      console.error("알림 삭제 실패:", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadCount();

      const handleUpdateNoti = () => {
        fetchUnreadCount();
      };

      window.addEventListener("updateUnreadCount", handleUpdateNoti);
      return () =>
        window.removeEventListener("updateUnreadCount", handleUpdateNoti);
    }
  }, [isLoggedIn]);

  const toggleNotiDropdown = () => {
    const nextState = !isNotiOpen;
    setIsNotiOpen(nextState);
    if (nextState) fetchNotifications();
  };

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

                {isNotiOpen && (
                  <div className="noti-dropdown">
                    <div className="noti-header">
                      <span>최근 알림</span>
                      {unreadCount > 0 && (
                        <button
                          className="read-all-btn"
                          onClick={handleReadAll}
                        >
                          모두 읽음
                        </button>
                      )}
                    </div>

                    <div className="noti-list">
                      {notifications.length === 0 ? (
                        <div className="noti-empty">
                          새로운 알림이 없습니다.
                        </div>
                      ) : (
                        notifications.map((noti) => (
                          <div
                            key={noti.id}
                            /* ✅ 수정: deletingIds에 포함되어 있으면 'deleting' 클래스 추가 */
                            className={`noti-item ${
                              noti.isRead ? "read" : "unread"
                            } ${
                              deletingIds.includes(noti.id) ? "deleting" : ""
                            }`}
                            onClick={() => handleNotiClick(noti)}
                          >
                            <div className="noti-content-wrapper">
                              <p className="noti-content">{noti.content}</p>
                              <button
                                className="delete-btn"
                                onClick={(e) => handleDelete(e, noti.id)}
                              >
                                ✕
                              </button>
                            </div>
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
