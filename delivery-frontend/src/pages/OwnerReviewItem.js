import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function OwnerReviewItem({ review, onRefresh }) {
  const [isEditing, setIsEditing] = useState(false); // 수정/등록 모드 여부
  const [content, setContent] = useState(review.reply?.content || "");
  const token = localStorage.getItem("token");

  // 등록 및 수정 통합 핸들러
  const handleSave = async () => {
    if (!content.trim()) return toast.warn("내용을 입력해주세요.");

    try {
      if (!review.reply) {
        // 1. 등록 (POST)
        await axios.post(
          `/api/reviews/${review.id}/reply`,
          { content },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("답글이 등록되었습니다.");
      } else {
        // 2. 수정 (PUT)
        await axios.put(
          `/api/reviews/${review.id}/reply`,
          { content },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("답글이 수정되었습니다.");
      }
      setIsEditing(false);
      onRefresh(); // 부모 컴포넌트의 목록 새로고침 함수 호출
    } catch (error) {
      toast.error(error.response?.data?.message || "작업에 실패했습니다.");
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까? 다시 작성해야 합니다.")) return;

    try {
      await axios.delete(`/api/reviews/${review.id}/reply`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("답글이 삭제되었습니다.");
      setContent("");
      onRefresh();
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={cardStyle}>
      <div style={reviewInfo}>
        <strong>{review.userNickname}</strong>
        <span>{"⭐".repeat(review.rating)}</span>
        <p>{review.content}</p>
        {review.imageUrl && (
          <img src={review.imageUrl} alt="리뷰" style={imgStyle} />
        )}
      </div>

      <div style={replySection}>
        {review.reply && !isEditing ? (
          /* 이미 답변이 있는 경우 (조회 모드) */
          <div style={replyBox}>
            <div style={replyHeader}>
              <strong>사장님 답변</strong>
              <div>
                <button onClick={() => setIsEditing(true)} style={actionBtn}>
                  수정
                </button>
                <button onClick={handleDelete} style={deleteBtn}>
                  삭제
                </button>
              </div>
            </div>
            <p>{review.reply.content}</p>
          </div>
        ) : (
          /* 답변이 없거나 수정 중인 경우 (입력 모드) */
          <div style={inputBox}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="손님에게 따뜻한 한마디를 남겨주세요."
              style={textareaStyle}
            />
            <div style={{ textAlign: "right", marginTop: "10px" }}>
              {isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setContent(review.reply.content);
                  }}
                  style={cancelBtn}
                >
                  취소
                </button>
              )}
              <button onClick={handleSave} style={saveBtn}>
                {review.reply ? "수정 완료" : "답글 등록"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 스타일링 ---
const cardStyle = {
  border: "1px solid #eee",
  borderRadius: "10px",
  padding: "20px",
  marginBottom: "20px",
  backgroundColor: "#fff",
};
const reviewInfo = { marginBottom: "15px" };
const imgStyle = { width: "100px", borderRadius: "5px", marginTop: "10px" };
const replySection = { borderTop: "1px dashed #ddd", paddingTop: "15px" };
const replyBox = {
  backgroundColor: "#f8f9fa",
  padding: "15px",
  borderRadius: "8px",
};
const replyHeader = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px",
};
const textareaStyle = {
  width: "100%",
  height: "80px",
  padding: "10px",
  borderRadius: "5px",
  border: "1px solid #ddd",
  resize: "none",
};
const actionBtn = {
  background: "none",
  border: "none",
  color: "#007bff",
  cursor: "pointer",
  marginRight: "10px",
};
const deleteBtn = {
  background: "none",
  border: "none",
  color: "#dc3545",
  cursor: "pointer",
};
const saveBtn = {
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  padding: "8px 16px",
  borderRadius: "5px",
  cursor: "pointer",
};
const cancelBtn = {
  background: "none",
  border: "none",
  marginRight: "10px",
  cursor: "pointer",
  color: "#666",
};

export default OwnerReviewItem;
