import React, { useState, useEffect } from "react";
import axios from "axios";
import StoreCard from "../components/StoreCard";
import Search from "../components/Search";
import CategoryNav from "../components/CategoryNav";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

function StoreListPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [likedStoreIds, setLikedStoreIds] = useState(new Set());

  const { token, isLoggedIn } = useAuth();

  // 카테고리별 한글 타이틀 매핑 객체
  const categoryTitles = {
    "": "우리 동네 맛집 목록",
    CHICKEN: "바삭한 치킨 맛집",
    PIZZA: "치즈 듬뿍 피자 맛집",
    KOREAN_FOOD: "든든한 한식 한 끼",
    CHINESE_FOOD: "불맛 가득 중식",
    JAPANESE_FOOD: "깔끔한 일식 모음",
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        // 1. 가게 목록 조회
        const response = await axios.get("http://localhost:8080/api/stores", {
          params: {
            keyword: searchTerm,
            category: selectedCategory,
          },
        });
        setStores(response.data.content || []);

        // 2. 로그인 상태라면 내 찜 목록 동기화
        if (isLoggedIn && token) {
          const likeRes = await axios.get(
            "http://localhost:8080/api/favorites/my",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const myLikedIds = new Set(likeRes.data.map((store) => store.id));
          setLikedStoreIds(myLikedIds);
        } else {
          setLikedStoreIds(new Set()); // 로그아웃 시 초기화
        }
      } catch (error) {
        console.error("데이터 로딩 실패", error);
        toast.error("가게 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [searchTerm, selectedCategory, isLoggedIn, token]); // 의존성 추가

  const handleToggleLike = async (storeId) => {
    if (!isLoggedIn) {
      toast.warn("로그인이 필요한 서비스입니다.");
      return;
    }

    const isCurrentlyLiked = likedStoreIds.has(storeId);

    try {
      if (isCurrentlyLiked) {
        await axios.delete(`http://localhost:8080/api/favorites/${storeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLikedStoreIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(storeId);
          return newSet;
        });
      } else {
        await axios.post(
          `http://localhost:8080/api/favorites/${storeId}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setLikedStoreIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(storeId);
          return newSet;
        });
      }
    } catch (error) {
      toast.error("찜 처리에 실패했습니다.");
    }
  };

  return (
    <div className="container" style={{ padding: "20px" }}>
      {/* 검색 바 */}
      <Search setSearchTerm={setSearchTerm} />

      {/* 카테고리 네비게이션 */}
      <CategoryNav
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <div style={{ marginTop: "30px" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          {categoryTitles[selectedCategory] || "가게 목록"}
        </h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            가게를 찾는 중입니다... 🔍
          </div>
        ) : stores.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", color: "#888" }}>
            해당하는 가게가 없습니다. 검색어를 확인해보세요!
          </div>
        ) : (
          <div className="store-grid" style={gridStyle}>
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                id={store.id}
                name={store.name}
                rating={store.averageRating}
                imageUrl={store.imageUrl}
                isLiked={likedStoreIds.has(store.id)}
                onToggleLike={handleToggleLike}
                deliveryFee={store.deliveryFee} // 추가 정보 전달
                minOrderAmount={store.minOrderAmount} // 추가 정보 전달
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "20px",
};

export default StoreListPage;
