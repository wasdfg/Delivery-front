import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "./ReviewWritePage.css";

function ReviewWritePage() {
  const { state } = useLocation(); // OrderHistoryPage에서 넘겨준 데이터 받기
  const { token } = useAuth();
  const navigate = useNavigate();

  const [rating, setRating] = useState(5); // 기본 별점 5점
  const [content, setContent] = useState("");

  // 데이터가 없으면(주소창 입력 등) 뒤로가기
  if (!state) {
    return <div>잘못된 접근입니다.</div>;
  }

  const { orderId, storeId, storeName } = state;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. 백엔드 리뷰 작성 API 호출 (POST)
      await axios.post(
        "http://localhost:8080/api/reviews",
        {
          orderId: orderId,
          storeId: storeId,
          rating: rating,
          content: content,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("리뷰가 등록되었습니다!");
      navigate("/orders"); // 주문 내역으로 돌아가기
    } catch (error) {
      console.error("리뷰 등록 실패", error);
      alert("리뷰 등록에 실패했습니다.");
    }
  };

  return (
    <div className="review-write-page">
      <h1>리뷰 쓰기</h1>
      <h3>{storeName}</h3>
      <p className="order-info">주문번호: {orderId}</p>

      <form onSubmit={handleSubmit}>
        {/* 별점 선택 UI */}
        <div className="rating-select">
          <label>별점</label>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((num) => (
              <span
                key={num}
                className={`star ${num <= rating ? "selected" : ""}`}
                onClick={() => setRating(num)}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <div className="content-input">
          <label>내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="음식 맛은 어떠셨나요? (최소 10자 이상)"
            required
            minLength={10}
            rows={5}
          />
        </div>

        <button type="submit" className="submit-btn">
          등록하기
        </button>
      </form>
    </div>
  );
}

export default ReviewWritePage;
