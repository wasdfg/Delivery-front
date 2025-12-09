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
          <button className="logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyPage;
