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

  // ✅ 추가됨: 가격 필터를 위한 상태 관리
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");

  const { token, isLoggedIn } = useAuth();

  const categoryTitles = {
    "": "우리 동네 맛집 목록",
    1: "바삭한 치킨 맛집", // 기존 CHICKEN
    2: "치즈 듬뿍 피자 맛집", // 기존 PIZZA
    3: "든든한 한식 한 끼", // 기존 KOREAN_FOOD
    4: "불맛 가득 중식", // 기존 CHINESE_FOOD
    5: "깔끔한 일식 모음", // 기존 JAPANESE_FOOD
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        // 1. 가게 목록 조회
        const response = await axios.get("http://localhost:8080/api/stores", {
          params: {
            keyword: searchTerm,
            categoryId:
              selectedCategory !== "" ? Number(selectedCategory) : null,
            // ✅ 추가됨: API 요청 시 필터 값 전송 (빈 문자열이 아니면 숫자로 변환)
            minOrderAmount:
              minOrderAmount !== "" ? Number(minOrderAmount) : null,
            deliveryFee: deliveryFee !== "" ? Number(deliveryFee) : null,
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
    // ✅ 추가됨: 필터 상태값이 변경될 때도 useEffect가 실행되도록 의존성 배열에 추가
  }, [
    searchTerm,
    selectedCategory,
    minOrderAmount,
    deliveryFee,
    isLoggedIn,
    token,
  ]);

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

      {/* ✅ 추가됨: 가격 필터 UI 영역 */}
      <div style={filterContainerStyle}>
        <select
          value={minOrderAmount}
          onChange={(e) => setMinOrderAmount(e.target.value)}
          style={selectStyle}
        >
          <option value="">최소주문금액 전체</option>
          <option value="5000">5,000원 이하</option>
          <option value="10000">10,000원 이하</option>
          <option value="15000">15,000원 이하</option>
        </select>

        <select
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(e.target.value)}
          style={selectStyle}
        >
          <option value="">배달비 전체</option>
          <option value="0">배달비 무료</option>
          <option value="1000">1,000원 이하</option>
          <option value="2000">2,000원 이하</option>
          <option value="3000">3,000원 이하</option>
        </select>
      </div>

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
                deliveryFee={store.deliveryFee}
                minOrderAmount={store.minOrderAmount}
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

// ✅ 추가됨: 필터 UI 스타일링
const filterContainerStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "15px",
  marginBottom: "10px",
};

const selectStyle = {
  padding: "8px",
  borderRadius: "5px",
  border: "1px solid #ddd",
  fontSize: "0.9rem",
  cursor: "pointer",
};

export default StoreListPage;
