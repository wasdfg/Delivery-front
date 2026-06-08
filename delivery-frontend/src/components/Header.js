import React, { useState, useEffect } from "react";
import "./Header.css";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

function Header() {
  const navigate = useNavigate();

  const { isLoggedIn, logout, user } = useAuth();
  const { cartItems } = useCart();

  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);

  const token = localStorage.getItem("token");

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =========================
  // 알림 개수 조회
  // =========================
  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(
        "/api/notifications/unread-count",
        authHeader
      );

      setUnreadCount(res.data);
    } catch (err) {
      console.error("알림 개수 조회 실패:", err);
    }
  };

  // =========================
  // 알림 목록 조회
  // =========================
  const fetchNotifications = async () => {
    try {
      const res = await axios.get("/api/notifications", authHeader);

      setNotifications(res.data);
    } catch (err) {
      console.error("알림 목록 조회 실패:", err);
    }
  };

  // =========================
  // 전체 읽음 처리
  // =========================
  const handleReadAll = async () => {
    try {
      await axios.patch("/api/notifications/read-all", {}, authHeader);

      setNotifications((prev) =>
        prev.map((noti) => ({
          ...noti,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("전체 읽음 처리 실패:", err);
      alert("전체 읽음 처리에 실패했습니다.");
    }
  };

  // =========================
  // 알림 삭제
  // =========================
  const handleDelete = async (e, notiId) => {
    e.stopPropagation();

    try {
      await axios.delete(`/api/notifications/${notiId}`, authHeader);

      setDeletingIds((prev) => [...prev, notiId]);

      setTimeout(() => {
        const deletedNoti = notifications.find((n) => n.id === notiId);

        setNotifications((prev) => prev.filter((noti) => noti.id !== notiId));

        setDeletingIds((prev) => prev.filter((id) => id !== notiId));

        if (deletedNoti && !deletedNoti.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }, 400);
    } catch (err) {
      console.error("알림 삭제 실패:", err);
    }
  };

  // =========================
  // 실시간 unread count 갱신 이벤트
  // =========================
  useEffect(() => {
    if (!isLoggedIn) return;

    fetchUnreadCount();

    const handleUpdateNoti = () => {
      fetchUnreadCount();
    };

    window.addEventListener("updateUnreadCount", handleUpdateNoti);

    return () => {
      window.removeEventListener("updateUnreadCount", handleUpdateNoti);
    };
  }, [isLoggedIn]);

  // =========================
  // 알림 드롭다운 열기
  // =========================
  const toggleNotiDropdown = () => {
    const nextState = !isNotiOpen;

    setIsNotiOpen(nextState);

    if (nextState) {
      fetchNotifications();
    }
  };

  // =========================
  // 알림 클릭
  // =========================
  const handleNotiClick = async (noti) => {
    try {
      // 읽지 않은 경우 읽음 처리
      if (!noti.isRead) {
        await axios.patch(`/api/notifications/${noti.id}/read`, {}, authHeader);

        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setIsNotiOpen(false);

      // 타입별 이동 처리
      switch (noti.type) {
        case "NEW_ORDER":
          navigate(noti.targetUrl);
          break;

        case "ORDER_STATUS_CHANGED":
          navigate(noti.targetUrl);
          break;

        case "DELIVERY_STARTED":
          navigate(noti.targetUrl);
          break;

        case "DELIVERY_COMPLETED":
          navigate(noti.targetUrl);
          break;

        case "RIDER_ARRIVING":
          navigate(noti.targetUrl);
          break;

        case "REVIEW_ADDED":
          navigate(noti.targetUrl);
          break;

        default:
          navigate(noti.targetUrl);
      }
    } catch (err) {
      console.error("알림 읽음 처리 실패:", err);
    }
  };

  // =========================
  // 장바구니 수량 계산
  // =========================
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // =========================
  // 로그아웃
  // =========================
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
              {/* ========================= */}
              {/* 알림 */}
              {/* ========================= */}
              <div
                className="nav-item-wrapper"
                style={{ position: "relative" }}
              >
                <button
                  onClick={toggleNotiDropdown}
                  className="nav-link-button bell-btn"
                >
                  🔔
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

              {/* ========================= */}
              {/* 메뉴 */}
              {/* ========================= */}

              <Link to="/mypage" className="nav-link">
                마이페이지
              </Link>

              <Link
                to="/favorites"
                style={{
                  textDecoration: "none",
                  color: "#333",
                  marginRight: "15px",
                }}
              >
                찜한 가게 ❤️
              </Link>

              <Link to="/orders" className="nav-link">
                주문 내역
              </Link>

              {/* 사장님 */}
              {user?.role === "STORE_OWNER" && (
                <>
                  <Link to="/owner/store/create" className="nav-link">
                    가게 등록
                  </Link>

                  <Link to="/owner/store" className="nav-link">
                    내 가게
                  </Link>

                  <Link to="/owner/orders" className="nav-link">
                    주문 관리
                  </Link>
                </>
              )}

              {/* 라이더 */}
              {user?.role === "RIDER" && (
                <Link to="/rider" className="nav-link">
                  라이더 페이지
                </Link>
              )}

              {/* 장바구니 */}
              <Link to="/cart" className="nav-link">
                🛒 장바구니
                {totalItems > 0 && (
                  <span className="cart-badge">{totalItems}</span>
                )}
              </Link>

              {/* 로그아웃 */}
              <button onClick={handleLogout} className="nav-link-button">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                로그인
              </Link>
              <Link to="/signup" className="nav-link">
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
