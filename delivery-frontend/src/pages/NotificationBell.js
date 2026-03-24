import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const NotificationBell = ({ user }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  // 1. 초기 안 읽은 개수 및 목록 가져오기
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    const res = await axios.get("/api/notifications/unread-count");
    setUnreadCount(res.data);
  };

  const fetchNotifications = async () => {
    const res = await axios.get("/api/notifications");
    setNotifications(res.data);
  };

  // 2. 종 아이콘 클릭 핸들러
  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) fetchNotifications();
  };

  // 3. 알림 클릭 시 (읽음 처리 + 이동)
  const handleNotiClick = async (noti) => {
    if (!noti.isRead) {
      await axios.patch(`/api/notifications/${noti.id}/read`);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsDropdownOpen(false);
    navigate(noti.targetUrl);
  };

  return (
    <div className="notification-wrapper" style={{ position: "relative" }}>
      <button onClick={handleBellClick} className="bell-btn">
        🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {isDropdownOpen && (
        <div className="notification-dropdown">
          <h4>최근 알림</h4>
          {notifications.length === 0 ? (
            <p className="empty">알림이 없습니다.</p>
          ) : (
            notifications.map((noti) => (
              <div
                key={noti.id}
                className={`noti-item ${noti.isRead ? "read" : "unread"}`}
                onClick={() => handleNotiClick(noti)}
              >
                <div className="noti-title">{noti.title}</div>
                <div className="noti-content">{noti.content}</div>
                <small>{new Date(noti.createdAt).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
