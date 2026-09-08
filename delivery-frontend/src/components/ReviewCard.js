import React from "react";
import "./ReviewCard.css";

import ReportButton from "./ReportButton";

function ReviewCard({ review }) {
  // ✅ 백엔드 DTO(userNickname)와 이름을 맞춥니다.
  const {
    userNickname,
    rating,
    content,
    createdAt,
    imageUrl,
    orderedProductNames,
    reply,
  } = review;

  const formattedDate = new Date(createdAt).toLocaleDateString();

  return (
    <div className="review-card">
      <div className="review-header">
        {/* username -> userNickname으로 수정 */}
        <span className="review-author">{userNickname || "익명 사용자"}</span>
        <span className="review-date">{formattedDate}</span>
      </div>

      <ReportButton targetType="REVIEW" targetId={review.id} />

      {/* 주문 상품 및 옵션 정보 */}
      {orderedProductNames && orderedProductNames.length > 0 && (
        <div className="ordered-items-info" style={orderInfoStyle}>
          {orderedProductNames.map((name, idx) => (
            <div
              key={idx}
              style={{
                fontSize: "0.85rem",
                color: "#666",
                marginBottom: "2px",
              }}
            >
              🛍️ {name}
            </div>
          ))}
        </div>
      )}

      <div className="review-stars">
        {"★".repeat(rating)}
        {"☆".repeat(5 - rating)}
        <span className="rating-number"> ({rating})</span>
      </div>

      {/* 리뷰 이미지 (에러 핸들링 추가) */}
      {imageUrl && (
        <img
          src={`http://localhost:8080${imageUrl}`}
          alt="Review"
          className="review-image"
          onError={(e) => {
            e.target.style.display = "none"; // 이미지 로드 실패 시 공간을 차지하지 않도록 숨김
          }}
          style={{
            width: "100%",
            borderRadius: "8px",
            marginTop: "10px",
            objectFit: "cover",
          }}
        />
      )}

      <p className="review-content">{content}</p>

      {/* ✅ [추가] 사장님 답글 섹션 */}
      {reply && (
        <div className="review-reply" style={replyStyle}>
          <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
            ㄴ 사장님 답글
          </div>
          <div style={{ color: "#444" }}>{reply.content}</div>
          <div style={{ fontSize: "0.8rem", color: "#999", marginTop: "5px" }}>
            {new Date(reply.createdAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}

// 스타일 객체
const orderInfoStyle = {
  backgroundColor: "#f8f9fa",
  padding: "10px",
  borderRadius: "8px",
  margin: "10px 0",
  border: "1px solid #eee",
};

const replyStyle = {
  marginTop: "15px",
  padding: "15px",
  backgroundColor: "#fff9db", // 연한 노란색 배경으로 답글 구분
  borderRadius: "8px",
  fontSize: "0.9rem",
  borderLeft: "4px solid #fab005",
};

export default ReviewCard;
