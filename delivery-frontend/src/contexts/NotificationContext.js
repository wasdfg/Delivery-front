import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";
import SockJS from "sockjs-client";
import Stomp from "stompjs";

import { EventSourcePolyfill, NativeEventSource } from "event-source-polyfill";

import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const EventSource = EventSourcePolyfill || NativeEventSource;

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();

  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const token = localStorage.getItem("token");

  // =========================
  // 초기 알림 조회
  // =========================
  useEffect(() => {
    if (!token || !user) return;

    const fetchNotifications = async () => {
      try {
        const [notificationRes, unreadRes] = await Promise.all([
          axios.get("http://localhost:8080/api/notifications", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          axios.get("http://localhost:8080/api/notifications/unread-count", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        setNotifications(notificationRes.data || []);

        setUnreadCount(unreadRes.data || 0);
      } catch (error) {
        console.error("알림 조회 실패", error);
      }
    };

    fetchNotifications();
  }, [token, user]);

  // =========================
  // 고객용 WebSocket
  // =========================
  useEffect(() => {
    if (!user || !user.id) return;

    const socket = new SockJS("http://localhost:8080/ws");

    const stompClient = Stomp.over(socket);

    stompClient.debug = null;

    stompClient.connect({}, () => {
      stompClient.subscribe(`/topic/user/${user.id}`, (message) => {
        const event = JSON.parse(message.body);

        let content = "새로운 알림이 도착했습니다.";

        if (event.newStatus) {
          const statusMsg = {
            ACCEPTED: "가게에서 주문을 접수했습니다! 🍳",
            DELIVERING: "배달이 시작되었습니다! 🚀",
            COMPLETED: "배달이 완료되었습니다. 😋",
            CANCELED: "주문이 취소되었습니다. 😥",
          };

          content = statusMsg[event.newStatus] || "주문 상태가 변경되었습니다.";
        }

        const newNotification = {
          id: Date.now(),
          title: "주문 상태 변경",
          content,
          targetUrl: `/orders/${event.orderId}`,
          createdAt: new Date(),
          read: false,
        };

        setNotifications((prev) => [newNotification, ...prev]);

        setUnreadCount((prev) => prev + 1);

        toast.info(content, {
          onClick: () => navigate(`/orders/${event.orderId}`),
        });
      });
    });

    return () => {
      if (stompClient.connected) {
        stompClient.disconnect();
      }
    };
  }, [user, navigate]);

  // =========================
  // 사장님 SSE
  // =========================
  useEffect(() => {
    if (!user || user.role !== "OWNER" || !user.storeId) return;

    const eventSource = new EventSource(
      `http://localhost:8080/api/notifications/subscribe/${user.storeId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },

        heartbeatTimeout: 3600000,
      }
    );

    eventSource.addEventListener("newOrder", (event) => {
      const content = event.data;

      const newNotification = {
        id: Date.now(),
        title: "신규 주문",
        content,
        targetUrl: `/store/${user.storeId}/orders`,
        createdAt: new Date(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);

      setUnreadCount((prev) => prev + 1);

      new Audio("/sounds/notification.mp3").play().catch(() => {});

      toast.success(`📦 ${content}`, {
        onClick: () => navigate(`/store/${user.storeId}/orders`),

        autoClose: 10000,
      });
    });

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user, navigate, token]);

  // =========================
  // 읽음 처리
  // =========================
  const readNotification = async (notificationId) => {
    try {
      await axios.patch(
        `http://localhost:8080/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("읽음 처리 실패", error);
    }
  };

  // =========================
  // 전체 읽음
  // =========================
  const readAllNotifications = async () => {
    try {
      await axios.patch(
        "http://localhost:8080/api/notifications/read-all",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("전체 읽음 실패", error);
    }
  };

  // =========================
  // 삭제
  // =========================
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `http://localhost:8080/api/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );
    } catch (error) {
      console.error("알림 삭제 실패", error);
    }
  };

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,

      readNotification,
      readAllNotifications,
      deleteNotification,
    }),

    [notifications, unreadCount]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
