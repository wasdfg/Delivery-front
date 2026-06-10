import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import StoreCard from "../components/StoreCard"; // 👈 1. import 추가 확인
import "./MyPage.css";

function MyPage() {
  const { user, token, logout } = useAuth(); // 👈 user 객체에서 role 가져오기
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favoriteStores, setFavoriteStores] = useState([]);
  const [couponCode, setCouponCode] = useState("");

  // API 호출 통합 관리 (Promise.all을 쓰면 더 효율적입니다)
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const [userRes, favRes] = await Promise.all([
          axios.get("http://localhost:8080/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8080/api/favorites/my", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setUserInfo(userRes.data);
        setFavoriteStores(favRes.data);
      } catch (error) {
        if (error.response?.status === 401) {
          alert("세션이 만료되었습니다.");
          logout();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, logout, navigate]);

  const handleRegisterCoupon = async () => {
    if (!couponCode) return;
    try {
      await axios.post(`http://localhost:8080/api/coupons/register`, null, {
        params: { code: couponCode },
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("쿠폰이 발급되었습니다! 🎉");
      setCouponCode("");
    } catch (error) {
      alert(error.response?.data?.message || "잘못된 쿠폰 코드입니다.");
    }
  };

  const handleRemoveLike = async (storeId) => {
    try {
      await axios.delete(`http://localhost:8080/api/favorites/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavoriteStores((prev) => prev.filter((s) => s.id !== storeId));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (!userInfo) return <div className="error">로그인이 필요합니다.</div>;

  return (
    <div
      className="mypage-container"
      style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}
    >
      <h1>마이페이지</h1>

      <div className="profile-section" style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ fontSize: "40px" }}>😊</div>
          <div>
            <h2 style={{ margin: 0 }}>{userInfo.name}님</h2>
            <p style={{ color: "#666", margin: "5px 0" }}>{userInfo.email}</p>
          </div>
        </div>
      </div>

      <div
        className="actions-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        <button className="action-btn" onClick={() => navigate("/orders")}>
          📄 주문 내역
        </button>
        <button className="action-btn" onClick={() => alert("준비 중")}>
          ✏️ 정보 수정
        </button>

        <Link to="/change-password" className="nav-link">
          비밀번호 변경
        </Link>

        {/* ✅ 권한별 버튼 분기 */}
        {user?.role === "STORE_OWNER" && (
          <button
            className="action-btn owner-btn"
            onClick={() => navigate("/owner/dashboard")}
            style={{ backgroundColor: "#e3f2fd" }}
          >
            🏪 내 가게 관리
          </button>
        )}

        {user?.role === "USER" && (
          <button onClick={() => navigate("/owner/store/create")}>
            가게 입점 문의
          </button>
        )}

        {user?.role === "RIDER" && (
          <button
            className="action-btn rider-btn"
            onClick={() => navigate("/rider")}
            style={{ backgroundColor: "#f3e5f5" }}
          >
            Sub🛵 배달 관리
          </button>
        )}
      </div>

      {/* 쿠폰 등록 영역 */}
      <div
        className="coupon-box"
        style={{
          ...sectionStyle,
          marginTop: "30px",
          backgroundColor: "#fff9db",
        }}
      >
        <h3>🎟️ 쿠폰 코드 등록</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="코드를 입력하세요"
            style={{ flex: 1, padding: "10px" }}
          />
          <button
            onClick={handleRegisterCoupon}
            style={{
              padding: "10px 20px",
              backgroundColor: "#fab005",
              border: "none",
              color: "#white",
              fontWeight: "bold",
            }}
          >
            등록
          </button>
        </div>
      </div>

      {/* 찜 목록 */}
      <h2 style={{ marginTop: "40px" }}>❤️ 내가 찜한 맛집</h2>
      <div
        className="favorite-list"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        {favoriteStores.map((store) => (
          <StoreCard
            key={store.id}
            {...store}
            isLiked={true}
            onToggleLike={() => handleRemoveLike(store.id)}
          />
        ))}
        {favoriteStores.length === 0 && <p>찜한 가게가 없습니다.</p>}
      </div>

      <button className="action-btn" onClick={() => navigate("/withdraw")}>
        회원 탈퇴
      </button>

      <button
        onClick={() => {
          logout();
          navigate("/");
        }}
        style={logoutBtnStyle}
      >
        로그아웃
      </button>
    </div>
  );
}

const sectionStyle = {
  padding: "20px",
  border: "1px solid #eee",
  borderRadius: "10px",
  marginBottom: "10px",
};
const logoutBtnStyle = {
  marginTop: "50px",
  width: "100%",
  padding: "15px",
  color: "#888",
  background: "none",
  border: "1px solid #ddd",
  cursor: "pointer",
};

export default MyPage;
