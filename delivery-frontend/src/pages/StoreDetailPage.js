import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MenuCard from "../components/MenuCard";
import ReviewCard from "../components/ReviewCard";

function StoreDetailPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();

  // 상태 관리
  const [store, setStore] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // 데이터 로딩
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 가게 상세 정보와 리뷰를 동시에 호출
        const [storeRes, reviewRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/stores/${storeId}`),
          axios.get(`http://localhost:8080/api/stores/${storeId}/reviews`),
        ]);

        setStore(storeRes.data);
        setReviews(reviewRes.data.content || reviewRes.data);
      } catch (error) {
        console.error("데이터를 불러오는 데 실패했습니다.", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId]);

  if (loading) return <div className="loading">가게 정보를 불러오는 중...</div>;
  if (!store) return <div className="error">가게 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="store-detail-container">
      {/* 상단 가게 정보 섹션 */}
      <section className="store-header">
        <h1>{store.name}</h1>
        <img
          src={`http://localhost:8080${store.imageUrl}`}
          alt={store.name}
          style={{ width: "100%", maxWidth: "600px", borderRadius: "8px" }}
        />
        <div className="store-meta">
          <p>평점: ⭐ {parseFloat(store.averageRating || 0).toFixed(1)}</p>
          <p>최소 주문 금액: {store.minOrderAmount?.toLocaleString()}원</p>
        </div>
      </section>

      <hr />

      {/* 메뉴 섹션 */}
      <section className="menu-section">
        <h2>메뉴</h2>
        <div className="menu-list">
          {!store.products || store.products.length === 0 ? (
            <p>메뉴 준비 중입니다.</p>
          ) : (
            store.products.map((product) => (
              // MenuCard 내부에서 product.stock을 사용하여 품절 처리를 하도록 전달
              <MenuCard key={product.id} product={product} />
            ))
          )}
        </div>

        {/* 사장님 전용 관리 버튼들 */}
        <div className="admin-actions" style={adminButtonStyle}>
          <button
            onClick={() => navigate(`/store/${storeId}/product/new`)}
            style={secondaryBtnStyle}
          >
            ➕ 메뉴 추가 (사장님)
          </button>
          <button
            onClick={() => navigate(`/store/${storeId}/orders`)}
            style={primaryBtnStyle}
          >
            📋 주문 관리 (사장님)
          </button>
        </div>
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

export default StoreDetailPage;
