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

  // 👈 SignUpPage에서 설정한 'OWNER'와 일치하도록 수정
  const isOwner = localStorage.getItem("userRole") === "OWNER";
  const token = localStorage.getItem("token");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [storeRes, reviewRes] = await Promise.all([
        axios.get(`http://localhost:8080/api/stores/${storeId}`),
        axios.get(`http://localhost:8080/api/stores/${storeId}/reviews`),
      ]);

      const storeData = storeRes.data;
      setStore(storeData);

      // 리뷰 데이터 구조 대응 (content 필드가 있는 페이징 처리 혹은 일반 리스트)
      setReviews(reviewRes.data.content || reviewRes.data || []);

      if (storeData.products) {
        const sorted = [...storeData.products].sort((a, b) => {
          // 품절된 메뉴(available: false)를 뒤로 보냄
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
  }, [storeId]);

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
              <span style={statusBadgeStyle(store.currentlyOrderable)}>
                {store.currentlyOrderable ? "● 영업 중" : "● 준비 중"}
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

        <div className="store-info-grid" style={infoGridStyle}>
          <div>
            <strong>최소주문</strong> {store.minOrderAmount?.toLocaleString()}원
          </div>
          <div>
            <strong>배달팁</strong> {store.deliveryFee?.toLocaleString()}원
          </div>
          <div>
            <strong>전화번호</strong> {store.phone || store.storePhone}
          </div>
          <div>
            <strong>주소</strong> {store.address || store.storeAddress}
          </div>
        </div>

        {/* 영업 시간 안내 */}
        <div style={operationInfoBoxStyle}>
          <h4 style={{ margin: "0 0 10px 0" }}>🕒 영업 시간</h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "10px",
            }}
          >
            {store.operationTimes?.map((ot) => (
              <div
                key={ot.dayOfWeek}
                style={{
                  fontSize: "0.85rem",
                  color: ot.isDayOff ? "#ff6b6b" : "#555",
                }}
              >
                <strong>{dayMap[ot.dayOfWeek]}:</strong>{" "}
                {ot.isDayOff ? "휴무" : `${ot.openTime} ~ ${ot.closeTime}`}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. 메뉴 섹션 */}
      <section className="menu-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #333",
            paddingBottom: "10px",
            marginBottom: "20px",
          }}
        >
          <h2>메뉴 리스트</h2>
          {isOwner && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => navigate(`/store/${storeId}/edit`)}
                className="btn-secondary"
              >
                가게 정보 수정
              </button>
              <button
                onClick={() => navigate(`/store/${storeId}/product/new`)}
                className="btn-primary"
              >
                ➕ 메뉴 추가
              </button>
            </div>
          )}
        </div>

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
              />
            ))
          )}
        </div>
      </section>

      {/* 3. 리뷰 섹션 */}
      <section className="review-section" style={{ marginTop: "60px" }}>
        <h2 style={{ borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
          최근 리뷰 ({reviews.length})
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          {reviews.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#888" }}>
              첫 번째 리뷰를 남겨주세요!
            </p>
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.reviewId} review={review} />
            ))
          )}
        </div>
      </section>

      {/* 사장님 퀵 메뉴 플로팅 (옵션) */}
      {isOwner && (
        <div style={floatingAdminStyle}>
          <button onClick={() => navigate(`/store/${storeId}/orders`)}>
            🔔 주문 현황 보러가기
          </button>
        </div>
      )}
    </div>
  );
}

// --- 스타일링 객체 ---
const statusBadgeStyle = (orderable) => ({
  padding: "4px 12px",
  borderRadius: "20px",
  backgroundColor: orderable ? "#e3f2fd" : "#ffebee",
  color: orderable ? "#1976d2" : "#c62828",
  fontWeight: "bold",
  fontSize: "0.9rem",
});

const bannerImageStyle = {
  width: "100%",
  height: "350px",
  objectFit: "cover",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginTop: "20px",
  padding: "20px",
  backgroundColor: "#fff",
  borderRadius: "8px",
  border: "1px solid #eee",
};

const operationInfoBoxStyle = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "8px",
  marginTop: "15px",
};

const statusToggleBtnStyle = (isManualClosed) => ({
  padding: "10px 16px",
  backgroundColor: isManualClosed ? "#2b8a3e" : "#e03131",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
});

const floatingAdminStyle = {
  position: "fixed",
  bottom: "30px",
  right: "30px",
  zIndex: 100,
  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  borderRadius: "30px",
  overflow: "hidden",
};

export default StoreDetailPage;
