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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ 1. 이미지 파일과 미리보기 URL을 관리할 상태 추가
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  if (!state || !state.orderId) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>잘못된 접근입니다. 주문 내역에서 리뷰 쓰기를 클릭해주세요.</p>
        <button onClick={() => navigate("/orders")}>주문 내역으로 가기</button>
      </div>
    );
  }

  const { orderId, storeId, storeName } = state;

  // ✅ 2. 이미지 선택 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // 이미지 미리보기 URL 생성
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.length < 10)
      return toast.warning("리뷰를 10자 이상 작성해주세요.");

    setIsSubmitting(true);
    try {
      // ✅ 3. 파일 전송을 위해 FormData 객체 생성
      const formData = new FormData();

      // 이미지 파일이 선택되었다면 추가 (백엔드 파라미터명 'image'에 맞춤)
      if (imageFile) {
        formData.append("image", imageFile);
      }

      // 텍스트 데이터들을 JSON 형태로 묶어서 Blob으로 추가 (백엔드 @RequestPart("data") 구조에 맞춤)
      const reviewData = { orderId, storeId, rating, content };
      formData.append(
        "data",
        new Blob([JSON.stringify(reviewData)], { type: "application/json" })
      );

      // ✅ 4. Content-Type을 multipart/form-data로 변경
      await axios.post("http://localhost:8080/api/reviews", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

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

        {/* ✅ 5. 사진 첨부 UI 추가 */}
        <div className="image-upload-group" style={{ marginBottom: "15px" }}>
          <label
            style={{
              fontWeight: "bold",
              display: "block",
              marginBottom: "8px",
            }}
          >
            사진 첨부 (선택)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ marginBottom: "10px" }}
          />
          {imagePreview && (
            <div style={{ position: "relative", display: "inline-block" }}>
              <img
                src={imagePreview}
                alt="미리보기"
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview("");
                }}
                style={removeImgBtnStyle}
              >
                X
              </button>
            </div>
          )}
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
// ✅ 미리보기 이미지 삭제 버튼 스타일
const removeImgBtnStyle = {
  position: "absolute",
  top: "-5px",
  right: "-5px",
  background: "red",
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: "20px",
  height: "20px",
  cursor: "pointer",
  fontSize: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default ReviewWritePage;
