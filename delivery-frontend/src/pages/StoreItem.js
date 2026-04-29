import React, { useState } from "react";
import axios from "axios";
import { FaHeart, FaRegHeart } from "react-icons/fa"; // 하트 아이콘
import { useNavigate } from "react-router-dom";

function StoreItem({ store, token }) {
  const navigate = useNavigate();

  // ✅ [핵심] 백엔드에서 넘겨준 초기값으로 State 설정
  const [isLiked, setIsLiked] = useState(store.isLiked || false);
  const [likeCount, setLikeCount] = useState(store.likeCount || 0);

  const handleLikeToggle = async (e) => {
    e.stopPropagation(); // 부모 요소(가게 상세 보기 등)로 클릭 이벤트가 번지는 것을 막음

    // 비로그인 유저 방어 로직
    if (!token) {
      alert("로그인이 필요한 기능입니다.");
      navigate("/login");
      return;
    }

    try {
      // 찜하기 토글 API 호출
      const response = await axios.post(
        `http://localhost:8080/api/stores/${store.id}/like`,
        {}, // POST 요청 body (데이터가 없어도 빈 객체 전달)
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newLikedStatus = response.data; // 백엔드에서 반환된 true/false

      // 프론트엔드 화면 즉시 업데이트 (새로고침 없이 하트 색상과 숫자 변경)
      setIsLiked(newLikedStatus);
      setLikeCount((prev) => (newLikedStatus ? prev + 1 : prev - 1));
    } catch (error) {
      console.error(error);
      alert("찜하기 처리에 실패했습니다.");
    }
  };

  return (
    <div style={cardStyle}>
      <img
        src={`http://localhost:8080${store.imageUrl}`}
        alt={store.name}
        style={imgStyle}
      />

      <div style={{ flex: 1 }}>
        <h3 style={{ margin: "0 0 5px 0" }}>{store.name}</h3>
        <p style={{ margin: "0", fontSize: "0.9rem", color: "#666" }}>
          ⭐ {store.rating || "0.0"} | 리뷰 {store.reviewCount || 0}
        </p>
      </div>

      {/* ✅ 찜하기 버튼과 카운트 영역 */}
      <div style={likeContainerStyle}>
        <button onClick={handleLikeToggle} style={likeBtnStyle}>
          {isLiked ? (
            <FaHeart color="#ff5252" size="24" />
          ) : (
            <FaRegHeart color="#ccc" size="24" />
          )}
        </button>
        <span style={likeCountStyle}>{likeCount}</span>
      </div>
    </div>
  );
}

// --- Styles ---
const cardStyle = {
  display: "flex",
  padding: "15px",
  borderBottom: "1px solid #eee",
  alignItems: "center",
};
const imgStyle = {
  width: "70px",
  height: "70px",
  borderRadius: "10px",
  marginRight: "15px",
  objectFit: "cover",
};
const likeContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minWidth: "40px",
};
const likeBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "5px",
};
const likeCountStyle = { fontSize: "0.8rem", color: "#888", marginTop: "2px" };

export default StoreItem;
