import React, { useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext"; // AuthContext 가져오기

// 👇 웹소켓 및 알림 라이브러리 추가
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // CSS 필수 import

// 페이지들 import (기존 유지)
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

function App() {
  const { user } = useAuth(); // 현재 로그인한 사용자 정보 (user.id 필요)

  // ✅ 전역 웹소켓 리스너 (고객용 알림)
  useEffect(() => {
    // 로그인이 안 되어 있거나 user ID가 없으면 연결 안 함
    if (!user || !user.id) return;

    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = Stomp.over(socket);
    // stompClient.debug = null; // 로그 끄기

    stompClient.connect({}, () => {
      console.log(`📡 고객용 웹소켓 연결됨: /topic/user/${user.id}`);

      // 내 ID로 오는 알림 구독
      stompClient.subscribe(`/topic/user/${user.id}`, (message) => {
        const event = JSON.parse(message.body);

        // (A) 상태 변경 알림 (OrderStatusChangedEvent)
        if (event.newStatus) {
          const statusMsg = {
            ACCEPTED: "가게에서 주문을 접수했습니다! 🍳",
            DELIVERING: "배달이 시작되었습니다! 🚀",
            COMPLETED: "배달이 완료되었습니다. 맛있게 드세요! 😋",
            CANCELED: "주문이 취소되었습니다. 😥",
          };
          const text =
            statusMsg[event.newStatus] || "주문 상태가 변경되었습니다.";
          toast.info(text);
        }

        // (B) 배달 시작 알림 (DeliveryStartedEvent - riderName 존재 시)
        else if (event.riderName) {
          toast.success(
            `🛵 라이더(${event.riderName})님이 배달을 시작했습니다!`
          );
        }

        // (C) 주문 수락 알림 (OrderAcceptedEvent - storeId 없고 userId만 있을 때 등)
        else if (!event.storeId && event.orderId) {
          toast.success("✅ 주문이 정상적으로 접수되었습니다.");
        }
      });
    });

    return () => {
      if (stompClient.connected) stompClient.disconnect();
    };
  }, [user]); // user가 변경(로그인/로그아웃)될 때마다 실행

  return (
    <div className="App">
      {/* 👇 알림이 뜰 위치 지정 (최상단) */}
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
