import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MenuCard from "../components/MenuCard";
import ReviewCard from "../components/ReviewCard";
import ProductOptionModal from "../components/ProductOptionModal";
import { toast } from "react-toastify";

function StoreDetailPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBlacklisted, setIsBlacklisted] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const isOwner = localStorage.getItem("userRole") === "OWNER";
  const token = localStorage.getItem("token");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const requests = [
        axios.get(`http://localhost:8080/api/stores/${storeId}`),
        axios.get(`http://localhost:8080/api/stores/${storeId}/reviews`),
      ];

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

      if (responses[2]) {
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

  // 🚨 [수정됨] 장바구니 담기 요청 함수: 다른 가게 메뉴 처리 로직 추가
  const handleAddToCart = async (cartData) => {
    if (!token) {
      toast.warn("로그인이 필요한 서비스입니다.");
      navigate("/login");
      return;
    }

    try {
      // 1. 정상적으로 장바구니 담기 시도
      await axios.post("http://localhost:8080/api/cart/items", cartData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("🛒 장바구니에 상품을 담았습니다.");
      setSelectedProduct(null); // 성공 시 모달 닫기
    } catch (error) {
      // 백엔드 에러 메시지 추출 (구조에 따라 data 또는 data.message 일 수 있음)
      const errorMessage =
        error.response?.data?.message || error.response?.data;

      // 2. "DIFFERENT_STORE" 에러를 받았을 때의 처리
      if (errorMessage === "DIFFERENT_STORE") {
        const wantToClear = window.confirm(
          "장바구니에는 같은 가게의 메뉴만 담을 수 있습니다.\n기존 장바구니를 비우고 새로 담으시겠습니까?"
        );

        if (wantToClear) {
          try {
            // 3. 비우기 API 호출
            await axios.delete("http://localhost:8080/api/cart/clear", {
              headers: { Authorization: `Bearer ${token}` },
            });

            // 4. 비우고 난 후, 아까 실패했던 장바구니 담기 다시 시도!
            await axios.post("http://localhost:8080/api/cart/items", cartData, {
              headers: { Authorization: `Bearer ${token}` },
            });

            toast.success("🧹 기존 장바구니를 비우고 새로 담았습니다!");
            setSelectedProduct(null); // 모달 닫기
          } catch (retryError) {
            console.error("다시 담기 실패:", retryError);
            toast.error("장바구니를 비우고 새로 담는 중 문제가 발생했습니다.");
          }
        }
      } else {
        // 그 외의 일반적인 에러
        toast.error(errorMessage || "장바구니 담기에 실패했습니다.");
      }
    }
  };

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

  return (
    <div
      className="store-detail-container"
      style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}
    >
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
                {isBlacklisted
                  ? "● 주문 제한"
                  : store.currentlyOrderable
                  ? "● 영업 중"
                  : "● 준비 중"}
              </span>
              <span style={{ color: "#fab005", fontWeight: "bold" }}>
                {" "}
                ⭐ {store.averageRating?.toFixed(1) || "0.0"}{" "}
              </span>
              <span style={{ color: "#888" }}>
                {" "}
                ({store.reviewCount}개의 리뷰){" "}
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
      </section>

      {/* 2. 메뉴 섹션 */}
      <section className="menu-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2>메뉴판</h2>
          {isOwner && (
            <button
              className="btn-primary"
              onClick={() => navigate(`/store/${storeId}/product/new`)}
            >
              ➕ 메뉴 추가
            </button>
          )}
        </div>

        <div className="menu-grid" style={menuGridStyle}>
          {products.length === 0 ? (
            <p style={emptyMessageStyle}>등록된 메뉴가 없습니다.</p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                onClick={() =>
                  !isOwner &&
                  !isBlacklisted &&
                  product.available &&
                  setSelectedProduct(product)
                }
                style={{
                  cursor:
                    !isOwner && !isBlacklisted && product.available
                      ? "pointer"
                      : "default",
                }}
              >
                <MenuCard
                  product={product}
                  onUpdate={fetchData}
                  disabled={isBlacklisted}
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* 옵션 선택 모달 */}
      {selectedProduct && (
        <ProductOptionModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* 3. 리뷰 섹션 */}
      <section className="review-section" style={{ marginTop: "60px" }}>
        <div style={reviewHeaderStyle}>
          <h2>최근 리뷰 ({reviews.length})</h2>
          {!isOwner && !isBlacklisted && (
            <button
              onClick={() => navigate(`/store/${storeId}/review/new`)}
              className="btn-primary"
            >
              ✍️ 리뷰 쓰기
            </button>
          )}
        </div>
        <div className="review-list">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    </div>
  );
}

// --- Style Objects ---
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

const bannerImageStyle = {
  width: "100%",
  height: "300px",
  objectFit: "cover",
  borderRadius: "15px",
};

const menuGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "20px",
};

const emptyMessageStyle = {
  gridColumn: "1/-1",
  textAlign: "center",
  padding: "40px",
  color: "#888",
};

const reviewHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #eee",
  paddingBottom: "10px",
  marginBottom: "20px",
};

const statusBadgeStyle = (isOpen) => ({
  backgroundColor: isOpen ? "#e7f5ff" : "#f1f3f5",
  color: isOpen ? "#1c7ed6" : "#868e96",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "0.9rem",
  fontWeight: "bold",
});

const statusToggleBtnStyle = (isClosed) => ({
  padding: "10px 15px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  backgroundColor: isClosed ? "#40c057" : "#fa5252",
  color: "white",
  fontWeight: "bold",
});

export default StoreDetailPage;
