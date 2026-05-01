import React, { useState, useEffect } from "react";
import axios from "axios";
import StoreCard from "../components/StoreCard";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

function MyFavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isLoggedIn || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // ✅ 우리가 백엔드에 만들어둔 '내 찜 목록 조회' API 호출
        const response = await axios.get(
          "http://localhost:8080/api/favorites/my",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setFavorites(response.data);
      } catch (error) {
        console.error("찜 목록 로딩 실패", error);
        toast.error("찜한 가게를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [token, isLoggedIn]);

  // 찜 취소 시 목록에서 바로 제거하기 위한 핸들러
  const handleToggleLike = async (storeId) => {
    try {
      // 찜 취소 API 호출
      await axios.delete(`http://localhost:8080/api/favorites/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ 현재 리스트에서 해당 가게 삭제 (새로고침 없이 UI 업데이트)
      setFavorites((prev) => prev.filter((store) => store.id !== storeId));
      toast.info("찜한 가게에서 제외되었습니다.");
    } catch (error) {
      toast.error("처리 중 오류가 발생했습니다.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={emptyContainerStyle}>
        <p>로그인이 필요한 페이지입니다. 🔒</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h2
        style={{ marginBottom: "20px", fontSize: "1.5rem", fontWeight: "bold" }}
      >
        ❤️ 내가 찜한 가게
      </h2>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          로딩 중... 🔃
        </div>
      ) : favorites.length === 0 ? (
        <div style={emptyContainerStyle}>
          <p style={{ fontSize: "1.2rem", color: "#888" }}>
            아직 찜한 가게가 없어요.
          </p>
          <p style={{ color: "#aaa" }}>마음에 드는 가게에 하트를 눌러보세요!</p>
        </div>
      ) : (
        <div className="store-grid" style={gridStyle}>
          {favorites.map((store) => (
            <StoreCard
              key={store.id}
              id={store.id}
              name={store.name}
              rating={store.averageRating}
              imageUrl={store.imageUrl}
              isLiked={true} // 이 페이지에 나오는 건 무조건 찜한 상태
              onToggleLike={handleToggleLike}
              deliveryFee={store.deliveryFee}
              minOrderAmount={store.minOrderAmount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "20px",
};

const emptyContainerStyle = {
  textAlign: "center",
  padding: "100px 20px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

export default MyFavoritesPage;
