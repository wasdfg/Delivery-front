import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // 1. useParams 훅 import
import axios from "axios";
import MenuCard from "../components/MenuCard";
import ReviewCard from "../components/ReviewCard";
import { useNavigate, useParams } from "react-router-dom";

function StoreDetailPage() {
  // 2. useParams()를 사용해 URL의 'storeId' 값을 가져옵니다.
  // (App.js에서 <Route path="/store/:storeId" ...>라고 정했기 때문)
  const { storeId } = useParams();

  // 3. 가게 정보(객체)와 로딩 상태를 관리할 state
  const [store, setStore] = useState(null); // 초기값은 null
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const navigate = useNavigate();

  // 4. 페이지가 처음 렌더링될 때 API를 호출
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const storeRes = await axios.get(
          `http://localhost:8080/api/stores/${storeId}`
        );
        setStore(storeRes.data);

        const reviewRes = await axios.get(
          `http://localhost:8080/api/stores/${storeId}/reviews`
        );
        setReviews(reviewRes.data.content || reviewRes.data);
        // 5. URL에서 가져온 storeId를 사용해 API를 호출
        const response = await axios.get(
          `http://localhost:8080/api/stores/${storeId}`
        );
        setStore(response.data); // 응답 데이터(객체)를 state에 저장
      } catch (error) {
        console.error("가게 상세 정보를 불러오는 데 실패했습니다.", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [storeId]); // 6. storeId가 바뀔 때마다 이 훅을 다시 실행

  // --- 7. 로딩 및 에러 처리 ---
  if (loading) {
    return <div>가게 정보를 불러오는 중...</div>;
  }
  if (!store) {
    return <div>가게 정보를 찾을 수 없습니다.</div>;
  }

  // --- 8. 로딩이 끝나고 store 데이터가 있으면 상세 정보 표시 ---
  return (
    <div>
      <h1>{store.name}</h1>
      <img
        src={`http://localhost:8080${store.imageUrl}`}
        alt={store.name}
        style={{ width: "100%", maxWidth: "600px" }}
      />
      <p>평점: ⭐ {parseFloat(store.averageRating).toFixed(1)}</p>
      <p>최소 주문 금액: {store.minOrderAmount}원</p>
      <hr />
      <h2>메뉴</h2>
      <div className="menu-list">
        {/* 3. store.products가 없거나 비어있는지 확인 */}
        {!store.products || store.products.length === 0 ? (
          <div>메뉴 준비 중입니다.</div>
        ) : (
          // 4. store.products 배열을 map으로 돌립니다.
          store.products.map((product) => (
            <MenuCard key={product.id} product={product} />
          ))
        )}
      </div>
      <div style={{ textAlign: "right", margin: "20px 0" }}>
        <button
          onClick={() => navigate(`/store/${storeId}/product/new`)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ➕ 메뉴 추가하기 (사장님)
        </button>
      </div>
      <h2>메뉴</h2>
      <hr />
      <div className="review-section">
        <h2>
          리뷰{" "}
          <span style={{ fontSize: "1rem", color: "#888" }}>
            ({reviews.length})
          </span>
        </h2>

        {reviews.length === 0 ? (
          <p>아직 작성된 리뷰가 없습니다.</p>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review.reviewId} review={review} />
          ))
        )}
      </div>
    </div>
  );
}

export default StoreDetailPage;
