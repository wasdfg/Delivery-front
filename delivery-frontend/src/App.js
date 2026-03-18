import React, { useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import { Routes, Route, useNavigate } from "react-router-dom"; // useNavigate 추가
import { useAuth } from "./contexts/AuthContext";

// 라이브러리 import
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { EventSourcePolyfill, NativeEventSource } from "event-source-polyfill";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 페이지 import
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

  // ✅ 1. 고객용 웹소켓 리스너 (주문 상태 변경 알림)
  useEffect(() => {
    if (!user || !user.id) return;

    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
      console.log(`📡 고객용 웹소켓 연결: /topic/user/${user.id}`);
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
            statusMsg[event.newStatus] || "주문 상태가 변경되었습니다."
          );
        } else if (event.riderName) {
          toast.success(
            `🛵 라이더(${event.riderName})님이 배달을 시작했습니다!`
          );
        }
      });
    });

    return () => {
      if (stompClient.connected) stompClient.disconnect();
    };
  }, [user]);

  // ✅ 2. 사장님용 SSE 리스너 (새 주문 실시간 알림)
  useEffect(() => {
    // user.role이 OWNER이고 storeId가 있는 경우에만 작동
    if (!user || user.role !== "OWNER" || !user.storeId) return;

    const token = localStorage.getItem("token");
    const eventSource = new EventSource(
      `http://localhost:8080/api/notifications/subscribe/${user.storeId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        heartbeatTimeout: 3600000,
      }
    );

    eventSource.addEventListener("connect", (e) => {
      console.log("🏪 사장님 SSE 연결 성공");
    });

    eventSource.addEventListener("newOrder", (e) => {
      // 알림음 재생
      new Audio("/sounds/notification.mp3").play().catch(() => {});

      toast.success(`📦 ${e.data}`, {
        onClick: () => navigate(`/store/${user.storeId}/orders`), // 알림 클릭 시 주문 페이지 이동
        autoClose: 10000,
      });
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
