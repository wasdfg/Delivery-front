import React from "react";
import "./ReviewCard.css"; // 스타일 파일

function ReviewCard({ review }) {
  const { username, rating, content, createdAt, imageUrl } = review;

  // 날짜 포맷팅 (YYYY-MM-DD)
  const formattedDate = new Date(createdAt).toLocaleDateString();

  return (
    <div className="review-card">
      <div className="review-header">
        <span className="review-author">{username}</span>
        <span className="review-date">{formattedDate}</span>
      </div>

      <div className="review-stars">
        {/* 별점만큼 ★ 표시 */}
        {"★".repeat(rating)}
        {"☆".repeat(5 - rating)}
        <span className="rating-number"> ({rating})</span>
      </div>

      {/* 리뷰 이미지가 있다면 표시 */}
      {imageUrl && (
        <img
          src={`http://localhost:8080${imageUrl}`}
          alt="Review"
          className="review-image"
        />
      )}

      <p className="review-content">{content}</p>
    </div>
  );
}

export default ReviewCard;
