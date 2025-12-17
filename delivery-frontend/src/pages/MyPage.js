import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./MyPage.css"; // 스타일 파일 (다음 단계)

function MyPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favoriteStores, setFavoriteStores] = useState([]);
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserInfo(response.data);
      } catch (error) {
        console.error("내 정보 로딩 실패", error);
        if (error.response?.status === 401) {
          alert("세션이 만료되었습니다. 다시 로그인해주세요.");
          logout();
          navigate("/login");
        }
      }
      setLoading(false);
    };

    if (token) fetchMyInfo();
  }, [token, logout, navigate]);

  useEffect(() => {
    if (token) {
      axios
        .get("http://localhost:8080/api/favorites/my", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setFavoriteStores(res.data))
        .catch((err) => console.error("찜 목록 로딩 실패", err));
    }
  }, [token]);

  const handleRemoveLike = async (storeId) => {
    try {
      await axios.delete(`http://localhost:8080/api/favorites/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // 화면에서 즉시 제거
      setFavoriteStores((prev) => prev.filter((store) => store.id !== storeId));
    } catch (error) {
      console.error("찜 취소 실패", error);
    }
  };

  const handleRegisterCoupon = async () => {
    if (!couponCode) return;
    try {
      // POST /api/coupons/register?code=WELCOME
      await axios.post(`http://localhost:8080/api/coupons/register`, null, {
        params: { code: couponCode },
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("쿠폰이 발급되었습니다! 🎉");
      setCouponCode("");
      // 필요하다면 여기서 쿠폰 목록 다시 불러오기 호출
    } catch (error) {
      alert(
        error.response?.data || "쿠폰 등록 실패 (이미 등록했거나 잘못된 코드)"
      );
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) return <div>로딩 중...</div>;
  if (!userInfo) return <div>정보를 불러올 수 없습니다.</div>;

  return (
    <div className="mypage-container">
      <h1>마이페이지</h1>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">😊</div>
          <h2>{userInfo.name} 님</h2>
          <p className="profile-email">{userInfo.email}</p>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <span className="label">전화번호</span>
            <span className="value">{userInfo.phone || "미등록"}</span>
          </div>
          <div className="detail-item">
            <span className="label">배달 주소</span>
            <span className="value">{userInfo.address || "미등록"}</span>
          </div>
        </div>

        <div className="mypage-actions">
          <button className="action-btn" onClick={() => navigate("/orders")}>
            📄 주문 내역 확인하기
          </button>
          <hr
            style={{
              width: "100%",
              margin: "10px 0",
              border: "none",
              borderTop: "1px solid #eee",
            }}
          />
          <button
            className="action-btn"
            onClick={() => navigate("/store/new")}
            style={{ backgroundColor: "#e3f2fd" }}
          >
            🏪 가게 등록하기 (사장님)
          </button>
          <button
            className="action-btn edit-btn"
            onClick={() => alert("수정 기능 준비 중!")}
          >
            ✏️ 내 정보 수정
          </button>
          <div
            className="coupon-registration"
            style={{
              marginTop: "30px",
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <h3>🎟️ 쿠폰 등록</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="쿠폰 코드 입력 (예: WELCOME)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{ padding: "10px", flex: 1 }}
              />
              <button onClick={handleRegisterCoupon} className="action-btn">
                등록
              </button>
            </div>
          </div>
          <button
            className="action-btn"
            onClick={() => navigate("/store/new")}
            style={{ backgroundColor: "#e3f2fd" }}
          >
            🏪 가게 등록하기 (사장님)
          </button>

          {/* 👇 라이더 전용 버튼 추가 */}
          <button
            className="action-btn"
            onClick={() => navigate("/rider")}
            style={{ backgroundColor: "#f3e5f5" }}
          >
            🛵 배달 시작하기 (라이더)
          </button>

          <h2 style={{ marginTop: "40px" }}>❤️ 내가 찜한 맛집</h2>

          {favoriteStores.length === 0 ? (
            <p style={{ color: "#888" }}>아직 찜한 가게가 없습니다.</p>
          ) : (
            <div
              className="store-grid"
              style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}
            >
              {favoriteStores.map((store) => (
                <StoreCard
                  key={store.id}
                  id={store.id}
                  name={store.name}
                  rating={store.averageRating} // DTO 필드명 확인 (averageRating 또는 rating)
                  imageUrl={store.imageUrl}
                  // 마이페이지에선 무조건 true (하트 채워짐)
                  isLiked={true}
                  // 클릭 시 찜 취소 핸들러 실행
                  onToggleLike={handleRemoveLike}
                />
              ))}
            </div>
          )}

          <button className="logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyPage;
