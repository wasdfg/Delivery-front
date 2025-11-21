import React from "react"; // 👈 useState는 잠시 제거
import "./App.css";
import Header from "./components/Header";
// 1. 라우팅을 위한 컴포넌트들을 import
import { Routes, Route } from "react-router-dom";
// 2. 페이지들을 import
import StoreListPage from "./pages/StoreListPage";
import StoreDetailPage from "./pages/StoreDetailPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import SignUpPage from "./pages/SignUpPage";

function App() {
  // 4. searchTerm 상태는 StoreListPage가 직접 관리하도록 이동시킬 예정 (여기선 삭제)

  return (
    <div className="App">
      <Header />
      <main>
        {/* 5. Routes가 URL을 보고 어떤 Route를 보여줄지 결정 */}
        <Routes>
          {/* 6. 기본 주소('/')로 접속하면 가게 목록 페이지를 표시 */}
          <Route path="/" element={<StoreListPage />} />

          {/* 7. '/store/가게ID' (예: /store/5)로 접속하면 가게 상세 페이지를 표시 */}
          <Route path="/store/:storeId" element={<StoreDetailPage />} />
          <Route path="/cart" element={<CartPage />} />

          <Route path="/login" element={<LoginPage />} />

          <Route path="/orders" element={<OrderHistoryPage />} />

          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
