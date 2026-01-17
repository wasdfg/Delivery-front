import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify"; // alert 대신 toast 추천
import "./ReviewWritePage.css";

function ReviewWritePage() {
  const { state } = useLocation();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // 👈 중복 방지

  // 데이터가 없거나 잘못된 접근일 경우 안전하게 차단
  if (!state || !state.orderId) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>잘못된 접근입니다. 주문 내역에서 리뷰 쓰기를 클릭해주세요.</p>
        <button onClick={() => navigate("/orders")}>주문 내역으로 가기</button>
      </div>
    );
  }

  const { orderId, storeId, storeName } = state;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.length < 10)
      return toast.warning("리뷰를 10자 이상 작성해주세요.");

    setIsSubmitting(true);
    try {
      await axios.post(
        "http://localhost:8080/api/reviews",
        { orderId, storeId, rating, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("리뷰가 소중하게 등록되었습니다! 🎉");
      navigate("/orders");
    } catch (error) {
      console.error("리뷰 등록 실패", error);
      toast.error(
        error.response?.data?.message ||
          "이미 리뷰를 작성하셨거나 등록에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="review-write-page"
      style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}
    >
      <header style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1>리뷰 쓰기</h1>
        <h2 style={{ color: "#339af0" }}>{storeName}</h2>
        <span style={{ fontSize: "0.9rem", color: "#888" }}>
          주문번호: #{orderId}
        </span>
      </header>

      <form onSubmit={handleSubmit} style={formStyle}>
        {/* 별점 섹션 */}
        <div
          className="rating-container"
          style={{ textAlign: "center", marginBottom: "25px" }}
        >
          <label
            style={{
              display: "block",
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            음식의 맛은 어떠셨나요?
          </label>
          <div
            className="stars"
            style={{ fontSize: "2rem", cursor: "pointer" }}
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <span
                key={num}
                style={{
                  color: num <= rating ? "#fab005" : "#e9ecef",
                  transition: "color 0.2s",
                }}
                onClick={() => setRating(num)}
              >
                ★
              </span>
            ))}
          </div>
          <p style={{ marginTop: "5px", color: "#555" }}>{rating}점 / 5점</p>
        </div>

        {/* 내용 입력 섹션 */}
        <div className="input-group">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="다른 손님들에게 도움이 될 수 있도록 솔직한 후기를 남겨주세요. (최소 10자)"
            required
            minLength={10}
            rows={6}
            style={textareaStyle}
          />
          <div
            style={{
              textAlign: "right",
              fontSize: "0.8rem",
              color: content.length < 10 ? "red" : "#888",
            }}
          >
            ({content.length} / 최소 10자)
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={submitBtnStyle(isSubmitting)}
        >
          {isSubmitting ? "등록 중..." : "리뷰 등록 완료"}
        </button>
      </form>
    </div>
  );
}

// 간단 스타일링
const formStyle = { display: "flex", flexDirection: "column", gap: "15px" };
const textareaStyle = {
  width: "100%",
  padding: "15px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "1rem",
  resize: "none",
};
const submitBtnStyle = (disabled) => ({
  padding: "15px",
  backgroundColor: disabled ? "#ccc" : "#339af0",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "1.1rem",
  fontWeight: "bold",
  cursor: disabled ? "not-allowed" : "pointer",
});

export default ReviewWritePage;
