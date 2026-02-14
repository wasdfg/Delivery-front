import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MenuCard from "../components/MenuCard";
import ReviewCard from "../components/ReviewCard";
import { toast } from "react-toastify";

function StoreDetailPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // [추가] 차단 상태값
  const [isBlacklisted, setIsBlacklisted] = useState(false);

  const isOwner = localStorage.getItem("userRole") === "OWNER";
  const token = localStorage.getItem("token");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // [수정] 블랙리스트 확인과 가게 데이터를 동시에 가져옴
      const requests = [
        axios.get(`http://localhost:8080/api/stores/${storeId}`),
        axios.get(`http://localhost:8080/api/stores/${storeId}/reviews`),
      ];

      // 로그인된 사용자이고 사장님이 아니라면 차단 여부 체크 API 추가
      if (token && !isOwner) {
        requests.push(
          axios.get(
            `http://localhost:8080/api/stores/${storeId}/blacklist/check`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        );
      }

      const responses = await Promise.all(requests);

      const storeData = responses[0].data;
      setStore(storeData);
      setReviews(responses[1].data.content || responses[1].data || []);

      // 블랙리스트 응답 처리
      if (responses[2]) {
        // 백엔드에서 boolean 값을 내려준다고 가정
        setIsBlacklisted(responses[2].data);
      }

      if (storeData.products) {
        const sorted = [...storeData.products].sort((a, b) => {
          const aAvailable = a.available !== false;
          const bAvailable = b.available !== false;
          return bAvailable - aAvailable;
        });
        setProducts(sorted);
      }
    } catch (error) {
      console.error("데이터 로딩 실패", error);
      toast.error("가게 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [storeId, token, isOwner]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 영업 상태 변경 (사장님 전용)
  const handleToggleManualClose = async () => {
    if (!window.confirm("영업 상태를 일시적으로 변경하시겠습니까?")) return;
    try {
      await axios.patch(
        `http://localhost:8080/api/stores/${storeId}/status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("가게 상태가 업데이트되었습니다.");
      fetchData();
    } catch (error) {
      toast.error("가게 상태 변경 권한이 없거나 서버 오류가 발생했습니다.");
    }
  };

  if (loading)
    return <div className="loading-spinner">가게 정보를 가져오는 중... 🍱</div>;
  if (!store) return <div className="not-found">가게를 찾을 수 없습니다.</div>;

  const dayMap = {
    MONDAY: "월",
    TUESDAY: "화",
    WEDNESDAY: "수",
    THURSDAY: "목",
    FRIDAY: "금",
    SATURDAY: "토",
    SUNDAY: "일",
  };

  return (
    <div
      className="store-detail-container"
      style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}
    >
      {/* [추가] 차단된 유저를 위한 안내 배너 */}
      {isBlacklisted && (
        <div style={blacklistBannerStyle}>
          🚫 점주님에 의해 이 매장의 주문 및 리뷰 작성이 제한되었습니다.
        </div>
      )}

      {/* 1. 상단 정보 섹션 */}
      <section className="store-header" style={{ marginBottom: "40px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "15px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "2.5rem", marginBottom: "10px" }}>
              {store.name || store.storeName}
            </h1>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span
                style={statusBadgeStyle(
                  store.currentlyOrderable && !isBlacklisted
                )}
              >
                {/* 차단된 경우 '영업 중'이라도 '주문 불가'로 인지되게 조건 추가 */}
                {isBlacklisted
                  ? "● 주문 제한"
                  : store.currentlyOrderable
                  ? "● 영업 중"
                  : "● 준비 중"}
              </span>
              <span style={{ color: "#fab005", fontWeight: "bold" }}>
                ⭐ {store.averageRating?.toFixed(1) || "0.0"}
              </span>
              <span style={{ color: "#888" }}>
                ({store.reviewCount}개의 리뷰)
              </span>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={handleToggleManualClose}
              style={statusToggleBtnStyle(store.isManualClosed)}
            >
              {store.isManualClosed ? "🔓 영업 시작하기" : "🔒 일시 영업 중지"}
            </button>
          )}
        </div>

        <img
          src={`http://localhost:8080${store.imageUrl}`}
          alt={store.name}
          style={bannerImageStyle}
          onError={(e) => {
            e.target.src =
              "https://via.placeholder.com/900x400?text=Store+Image";
          }}
        />
        {/* ... (기존 정보 그리드 및 영업시간 코드는 동일) */}
      </section>

      {/* 2. 메뉴 섹션 */}
      <section className="menu-section">
        {/* ... (메뉴 리스트 타이틀 및 사장님 메뉴 추가 버튼 동일) */}
        <div
          className="menu-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {products.length === 0 ? (
            <p
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "40px",
                color: "#888",
              }}
            >
              등록된 메뉴가 없습니다.
            </p>
          ) : (
            products.map((product) => (
              <MenuCard
                key={product.id}
                product={product}
                onUpdate={fetchData}
                // [추가] 차단된 경우 MenuCard 내부에서도 주문 버튼을 비활성화할 수 있도록 전달
                disabled={isBlacklisted}
              />
            ))
          )}
        </div>
      </section>

      {/* 3. 리뷰 섹션 */}
      <section className="review-section" style={{ marginTop: "60px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #eee",
            paddingBottom: "10px",
          }}
        >
          <h2>최근 리뷰 ({reviews.length})</h2>
          {/* [추가] 차단되지 않은 일반 손님만 리뷰 작성 버튼 노출 (필요 시) */}
          {!isOwner && !isBlacklisted && (
            <button
              onClick={() => navigate(`/store/${storeId}/review/new`)}
              className="btn-primary"
            >
              ✍️ 리뷰 쓰기
            </button>
          )}
        </div>
        {/* ... (리뷰 카드 리스트 렌더링 동일) */}
      </section>

      {/* ... (사장님 퀵 메뉴 동일) */}
    </div>
  );
}

// --- 추가된 스타일 ---
const blacklistBannerStyle = {
  backgroundColor: "#fff1f0",
  border: "1px solid #ffa39e",
  color: "#cf1322",
  padding: "15px",
  textAlign: "center",
  borderRadius: "12px",
  marginBottom: "20px",
  fontWeight: "bold",
  fontSize: "1.1rem",
};

// ... (기존 스타일링 객체 생략)
