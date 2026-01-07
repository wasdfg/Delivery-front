import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MenuCard from "../components/MenuCard";
import ReviewCard from "../components/ReviewCard";

function StoreDetailPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();

  // 상태 관리
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]); // 정렬된 상품 목록 별도 관리
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // 현재 유저 정보 (실제 프로젝트의 Auth 로직에 맞춰 수정하세요)
  const isOwner = localStorage.getItem("userRole") === "STORE_OWNER";
  const token = localStorage.getItem("token");

  // 데이터 로딩 함수
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [storeRes, reviewRes] = await Promise.all([
        axios.get(`http://localhost:8080/api/stores/${storeId}`),
        axios.get(`http://localhost:8080/api/stores/${storeId}/reviews`),
      ]);

      const storeData = storeRes.data;
      setStore(storeData);
      setReviews(reviewRes.data.content || reviewRes.data || []);

      // ✅ [1번 기능] 상품 정렬: 판매 중(available)인 것을 위로, 품절을 아래로
      // 백엔드 DTO의 필드명이 isAvailable인지 available인지 확인 필요 (여기선 available 기준)
      if (storeData.products) {
        const sorted = [...storeData.products].sort((a, b) => {
          const aAvailable = a.available ?? true; // 필드가 없으면 판매중으로 간주
          const bAvailable = b.available ?? true;
          return bAvailable - aAvailable;
        });
        setProducts(sorted);
      }
    } catch (error) {
      console.error("데이터를 불러오는 데 실패했습니다.", error);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ [4번 기능] 사장님 수동 영업 상태 토글 핸들러
  const handleToggleManualClose = async () => {
    if (!window.confirm("가게 영업 상태를 변경하시겠습니까?")) return;
    try {
      await axios.patch(
        `http://localhost:8080/api/stores/${storeId}/status`, // 백엔드 API 경로 확인 필요
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // 상태 변경 후 데이터 새로고침
    } catch (error) {
      alert("가게 상태 변경에 실패했습니다.");
    }
  };

  if (loading) return <div className="loading">가게 정보를 불러오는 중...</div>;
  if (!store) return <div className="error">가게 정보를 찾을 수 없습니다.</div>;

  // 요일 한글 변환 맵
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
      style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}
    >
      {/* 상단 가게 정보 및 영업 상태 */}
      <section className="store-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1>{store.storeName}</h1> {/* DTO 필드명 반영: storeName */}
            {/* ✅ [4번 기능] 최종 영업 상태 표시 */}
            <div style={{ marginBottom: "10px" }}>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  backgroundColor: store.currentlyOrderable
                    ? "#e3f2fd"
                    : "#ffebee",
                  color: store.currentlyOrderable ? "#1976d2" : "#c62828",
                  fontWeight: "bold",
                }}
              >
                {store.currentlyOrderable
                  ? "● 영업 중"
                  : "● 준비 중 / 영업 종료"}
              </span>
            </div>
          </div>

          {/* ✅ 사장님 전용 수동 제어 버튼 (isManualClosed 필드명 반영) */}
          {isOwner && (
            <button
              onClick={handleToggleManualClose}
              style={statusToggleBtnStyle(store.isManualClosed)}
            >
              {store.isManualClosed ? "🔓 수동 중지 해제" : "🔒 일시 영업 중지"}
            </button>
          )}
        </div>

        <img
          src={`http://localhost:8080${store.imageUrl}`}
          alt={store.storeName}
          style={{
            width: "100%",
            height: "300px",
            objectFit: "cover",
            borderRadius: "8px",
          }}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/600x300?text=No+Image";
          }}
        />

        <div className="store-meta" style={{ marginTop: "15px" }}>
          <p>전화번호: {store.storePhone}</p>
          <p>주소: {store.storeAddress}</p>
          <p>
            평점: ⭐ {store.averageRating || "0.0"} ({store.reviewCount}개의
            리뷰)
          </p>
          <p>최소 주문 금액: {store.minOrderAmount?.toLocaleString()}원</p>
          <p>배달팁: {store.deliveryFee?.toLocaleString()}원</p>

          {/* ✅ [4번 기능] 요일별 영업 시간 안내 섹션 (데이터 없을 시 예외처리) */}
          <div style={operationInfoBoxStyle}>
            <h4 style={{ margin: "0 0 10px 0" }}>🕒 영업 시간 안내</h4>
            {store.operationTimes && store.operationTimes.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "5px",
                }}
              >
                {store.operationTimes.map((ot) => (
                  <div
                    key={ot.dayOfWeek}
                    style={{ fontSize: "0.85rem", color: "#666" }}
                  >
                    <strong>{dayMap[ot.dayOfWeek] || ot.dayOfWeek}:</strong>{" "}
                    {ot.isDayOff ? "휴무" : `${ot.openTime} ~ ${ot.closeTime}`}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "0.85rem", color: "#999" }}>
                등록된 영업 시간 정보가 없습니다.
              </p>
            )}
          </div>
        </div>
      </section>

      <hr />

      {/* 메뉴 섹션 */}
      <section className="menu-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>메뉴</h2>
          {isOwner && (
            <button
              onClick={() => navigate(`/store/${storeId}/edit`)}
              style={{
                padding: "5px 10px",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              ⚙️ 가게 정보 수정
            </button>
          )}
        </div>

        <div className="menu-list">
          {products.length === 0 ? (
            <p>메뉴 준비 중입니다.</p>
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

        {isOwner && (
          <div className="admin-actions" style={adminButtonStyle}>
            <button
              onClick={() => navigate(`/store/${storeId}/product/new`)}
              style={secondaryBtnStyle}
            >
              ➕ 메뉴 추가
            </button>
            <button
              onClick={() => navigate(`/store/${storeId}/orders`)}
              style={primaryBtnStyle}
            >
              📋 주문 관리
            </button>
          </div>
        )}
      </section>

      <hr />

      {/* 리뷰 섹션 */}
      <section className="review-section">
        <h2>리뷰 ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p>아직 작성된 리뷰가 없습니다.</p>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review.reviewId} review={review} />
          ))
        )}
      </section>
    </div>
  );
}

// 스타일 정의
const operationInfoBoxStyle = {
  backgroundColor: "#f8f9fa",
  padding: "15px",
  borderRadius: "8px",
  marginTop: "15px",
  border: "1px solid #eee",
};

const statusToggleBtnStyle = (isManualClosed) => ({
  padding: "8px 16px",
  backgroundColor: isManualClosed ? "#28a745" : "#dc3545",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
});

const adminButtonStyle = {
  textAlign: "right",
  margin: "30px 0",
  display: "flex",
  gap: "10px",
  justifyContent: "flex-end",
};
const primaryBtnStyle = {
  padding: "10px 20px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
const secondaryBtnStyle = {
  padding: "10px 20px",
  backgroundColor: "#6c757d",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

export default StoreDetailPage;
