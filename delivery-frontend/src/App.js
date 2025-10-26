import React, { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import Search from "./components/Search";
import StoreListPage from "./pages/StoreListPage";

function App() {
  // 1. searchTerm 상태를 App.js (부모)에서 관리합니다.
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="App">
      <Header />
      <main>
        {/* 2. Search 컴포넌트에는 상태를 '설정'하는 함수를 내려줍니다. */}
        <Search setSearchTerm={setSearchTerm} />

        {/* 3. StoreListPage에는 '현재' 상태 값을 내려줍니다. */}
        <StoreListPage searchTerm={searchTerm} />
      </main>
    </div>
  );
}

export default App;
