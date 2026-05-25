import React, { useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// websocket / sse
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { EventSourcePolyfill, NativeEventSource } from "event-source-polyfill";

// toast
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// pages
import StoreListPage from "./pages/StoreListPage";
import StoreDetailPage from "./pages/StoreDetailPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import SignUpPage from "./pages/SignUpPage";
import MyPage from "./pages/MyPage";
import ReviewWritePage from "./pages/ReviewWritePage";
import StoreCreatePage from "./pages/StoreCreatePage";
import ProductCreatePage from "./pages/ProductCreatePage";
import OwnerOrderPage from "./pages/OwnerOrderPage";
import RiderPage from "./pages/RiderPage";
import StoreEditPage from "./pages/StoreEditPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import MyFavoritesPage from "./pages/MyFavoritesPage";

const EventSource = EventSourcePolyfill || NativeEventSource;

function App() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // =========================
  // unread count 갱신 이벤트
  // =========================
  const refreshUnreadCount = () => {
    window.dispatchEvent(new CustomEvent("updateUnreadCount"));
  };

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

        console.log("실시간 이벤트 수신:", event);

        switch (event.type) {
          // =========================
          // 주문 상태 변경
          // =========================
          case "ORDER_STATUS_CHANGED": {
            const statusMsg = {
              ACCEPTED: "가게에서 주문을 접수했습니다! 🍳",

              DELIVERING: "배달이 시작되었습니다! 🚀",

              COMPLETED: "배달이 완료되었습니다 😋",

              CANCELED: "주문이 취소되었습니다 😥",
            };

            toast.info(
              statusMsg[event.newStatus] || "주문 상태가 변경되었습니다.",
              {
                onClick: () => navigate(`/orders/${event.orderId}`),
              }
            );

            break;
          }

          // =========================
          // 배달 시작
          // =========================
          case "DELIVERY_STARTED": {
            toast.info(`🛵 ${event.riderName} 라이더가 배달을 시작했습니다.`, {
              onClick: () => navigate(`/orders/${event.orderId}`),
            });

            break;
          }

          // =========================
          // 라이더 곧 도착
          // =========================
          case "RIDER_ARRIVING": {
            toast.success("📍 라이더가 곧 도착합니다!", {
              onClick: () => navigate(`/orders/${event.orderId}`),
            });

            break;
          }

          // =========================
          // 배달 완료
          // =========================
          case "DELIVERY_COMPLETED": {
            toast.success("🎉 배달이 완료되었습니다!", {
              onClick: () => navigate(`/orders/${event.orderId}`),
            });

            break;
          }

          // =========================
          // 기본
          // =========================
          default: {
            toast.info("새로운 알림이 도착했습니다.");

            break;
          }
        }

        // =========================
        // unread count 갱신
        // =========================
        refreshUnreadCount();
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
    if (!user || user.role !== "OWNER" || !user.storeId) {
      return;
    }

    const token = localStorage.getItem("token");

    const eventSource = new EventSource(
      `http://localhost:8080/api/notifications/subscribe/${user.storeId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },

        heartbeatTimeout: 3600000,
      }
    );

    // =========================
    // 신규 주문
    // =========================
    eventSource.addEventListener("newOrder", (e) => {
      new Audio("/sounds/notification.mp3").play().catch(() => {});

      toast.success(`📦 ${e.data}`, {
        onClick: () => navigate(`/store/${user.storeId}/orders`),

        autoClose: 10000,
      });

      refreshUnreadCount();
    });

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user, navigate]);

  return (
    <div className="App">
      <ToastContainer position="top-right" autoClose={3000} />

      <Header />

      <main>
        <Routes>
          <Route path="/" element={<StoreListPage />} />

          <Route path="/store/:storeId" element={<StoreDetailPage />} />

          <Route path="/store/:storeId/edit" element={<StoreEditPage />} />

          <Route path="/cart" element={<CartPage />} />

          <Route path="/login" element={<LoginPage />} />

          <Route path="/orders" element={<OrderHistoryPage />} />

          <Route path="/orders/:orderId" element={<OrderDetailPage />} />

          <Route path="/signup" element={<SignUpPage />} />

          <Route path="/mypage" element={<MyPage />} />

          <Route path="/review/write" element={<ReviewWritePage />} />

          <Route path="/store/new" element={<StoreCreatePage />} />

          <Route
            path="/store/:storeId/product/new"
            element={<ProductCreatePage />}
          />

          <Route path="/store/:storeId/orders" element={<OwnerOrderPage />} />

          <Route path="/owner/orders" element={<OwnerOrderPage />} />

          <Route path="/rider" element={<RiderPage />} />

          <Route path="/favorites" element={<MyFavoritesPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
