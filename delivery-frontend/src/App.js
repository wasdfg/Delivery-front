import React, { useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// 라이브러리 import
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { EventSourcePolyfill, NativeEventSource } from "event-source-polyfill";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 페이지 import (생략된 부분 유지)
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

const EventSource = EventSourcePolyfill || NativeEventSource;

function App() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ 알림 개수 갱신을 위한 커스텀 이벤트 발생 함수
  const refreshUnreadCount = () => {
    window.dispatchEvent(new CustomEvent("updateUnreadCount"));
  };

  // ✅ 1. 고객용 웹소켓 리스너 (주문 상태 변경 알림)
  useEffect(() => {
    if (!user || !user.id) return;

    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = Stomp.over(socket);
    stompClient.debug = null; // 콘솔 로그가 너무 많으면 끔

    stompClient.connect({}, () => {
      stompClient.subscribe(`/topic/user/${user.id}`, (message) => {
        const event = JSON.parse(message.body);

        if (event.newStatus) {
          const statusMsg = {
            ACCEPTED: "가게에서 주문을 접수했습니다! 🍳",
            DELIVERING: "배달이 시작되었습니다! 🚀",
            COMPLETED: "배달이 완료되었습니다. 맛있게 드세요! 😋",
            CANCELED: "주문이 취소되었습니다. 😥",
          };

          toast.info(
            statusMsg[event.newStatus] || "주문 상태가 변경되었습니다.",
            {
              onClick: () => navigate(`/orders/${event.orderId}`), // 알림 클릭 시 상세페이지로
            }
          );

          refreshUnreadCount(); // 알림 숫자가 올라가도록 신호 발생
        }
      });
    });

    return () => {
      if (stompClient.connected) stompClient.disconnect();
    };
  }, [user, navigate]);

  // ✅ 2. 사장님용 SSE 리스너 (새 주문 실시간 알림)
  useEffect(() => {
    if (!user || user.role !== "OWNER" || !user.storeId) return;

    const token = localStorage.getItem("token");
    const eventSource = new EventSource(
      `http://localhost:8080/api/notifications/subscribe/${user.storeId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        heartbeatTimeout: 3600000,
      }
    );

    eventSource.addEventListener("newOrder", (e) => {
      new Audio("/sounds/notification.mp3").play().catch(() => {});

      toast.success(`📦 ${e.data}`, {
        onClick: () => navigate(`/store/${user.storeId}/orders`),
        autoClose: 10000,
      });

      refreshUnreadCount(); // 사장님 헤더 알림 숫자 갱신
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
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/review/write" element={<ReviewWritePage />} />
          <Route path="/store/new" element={<StoreCreatePage />} />
          <Route
            path="/store/:storeId/product/new"
            element={<ProductCreatePage />}
          />
          <Route path="/store/:storeId/orders" element={<OwnerOrderPage />} />
          <Route path="/rider" element={<RiderPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
