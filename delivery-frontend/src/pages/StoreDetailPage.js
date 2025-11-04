import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // 1. useParams 훅 import
import axios from "axios";

function StoreDetailPage() {
  // 2. useParams()를 사용해 URL의 'storeId' 값을 가져옵니다.
  // (App.js에서 <Route path="/store/:storeId" ...>라고 정했기 때문)
  const { storeId } = useParams();

  // 3. 가게 정보(객체)와 로딩 상태를 관리할 state
  const [store, setStore] = useState(null); // 초기값은 null
  const [loading, setLoading] = useState(true);

  // 4. 페이지가 처음 렌더링될 때 API를 호출
  useEffect(() => {
    const fetchStoreDetail = async () => {
      try {
        setLoading(true);
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

    fetchStoreDetail();
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
        src={store.imageUrl}
        alt={store.name}
        style={{ width: "100%", maxWidth: "600px" }}
      />
      <p>평점: ⭐ {parseFloat(store.averageRating).toFixed(1)}</p>
      <p>최소 주문 금액: {store.minOrderAmount}원</p>
      <hr />
      <h2>메뉴</h2>
      {/* 나중에 여기에 store.products 배열을 map으로 돌려서
        메뉴 목록(MenuCard)을 표시할 것입니다.
      */}
    </div>
  );
}

export default StoreDetailPage;
