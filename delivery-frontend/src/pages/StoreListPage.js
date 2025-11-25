import React, { useState, useEffect } from "react";
import axios from "axios";
import StoreCard from "../components/StoreCard";
import Search from "../components/Search";
import CategoryNav from "../components/CategoryNav";

function StoreListPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  // 2. searchTerm 상태를 StoreListPage가 직접 관리
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true); // 2. API 요청 시작 직전, 로딩 상태를 true로 변경
        const response = await axios.get("http://localhost:8080/api/stores", {
          params: {
            keyword: searchTerm,
            category: selectedCategory,
          },
        });
        console.log("서버에서 받은 데이터:", response.data.content);

        setStores(response.data.content);
      } catch (error) {
        console.error("가게 목록을 불러오는 데 실패했습니다.", error);
      }
      setLoading(false); // 3. API 요청이 (성공하든 실패하든) 끝나면 로딩 상태를 false로 변경
    };

    fetchStores();
  }, [searchTerm, selectedCategory]);

  // 4. 만약 '로딩 중' (loading이 true)이라면, 로딩 메시지를 표시
  if (loading) {
    return <div>가게 목록을 불러오는 중...</div>;
  }

  // 5. '로딩 중'이 아니라면 (loading이 false) 아래 내용을 표시
  return (
    <div>
      <Search setSearchTerm={setSearchTerm} />

      <CategoryNav
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <h2>
        {/* 카테고리 이름에 따라 제목 바꾸기 (선택사항) */}
        {selectedCategory === ""
          ? "우리 동네 가게 목록"
          : selectedCategory === "CHICKEN"
          ? "치킨 맛집 모음"
          : "가게 목록"}
      </h2>
      {stores.length === 0 ? (
        <div>검색된 가게가 없습니다.</div>
      ) : (
        <div className="store-list">
          {stores.map((store) => (
            <StoreCard
              key={store.id} // 👈 storeName -> store.id
              id={store.id} // 👈 storeName -> store.id
              name={store.name} // 👈 storeName -> store.name
              rating={store.averageRating}
              imageUrl={store.imageUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default StoreListPage;
