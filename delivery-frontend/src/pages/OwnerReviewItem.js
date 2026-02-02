import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function OwnerReviewItem({ review, onReplySuccess }) {
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const token = localStorage.getItem("token");

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return toast.warn("내용을 입력해주세요.");

    try {
      await axios.post(
        `http://localhost:8080/api/reviews/${review.id}/replies`,
        { content: replyContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("답글이 등록되었습니다.");
      onReplySuccess(); // 목록 새로고침
    } catch (error) {
      toast.error(error.response?.data?.message || "답글 등록 실패");
    }
  };

  return (
    <div style={reviewCardStyle}>
      <div style={headerStyle}>
        <strong>{review.customerName}</strong> ⭐ {review.rating}
      </div>
      <p>{review.content}</p>

      {/* 답글이 이미 있는 경우 */}
      {review.reply ? (
        <div style={replyBoxStyle}>
          <strong>사장님 답변:</strong>
          <p>{review.reply.content}</p>
        </div>
      ) : (
        /* 답글이 없는 경우만 입력창 표시 */
        <div style={{ marginTop: "10px" }}>
          {!isReplying ? (
            <button onClick={() => setIsReplying(true)} style={btnStyle}>
              답글 달기
            </button>
          ) : (
            <div>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="감사 인사를 남겨보세요!"
                style={textareaStyle}
              />
              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => setIsReplying(false)}
                  style={cancelBtnStyle}
                >
                  취소
                </button>
                <button onClick={handleReplySubmit} style={submitBtnStyle}>
                  등록
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 간단 스타일
const reviewCardStyle = { borderBottom: "1px solid #eee", padding: "20px" };
const replyBoxStyle = {
  backgroundColor: "#f8f9fa",
  padding: "15px",
  borderRadius: "8px",
  marginTop: "10px",
};
const btnStyle = {
  padding: "5px 12px",
  borderRadius: "4px",
  border: "1px solid #ddd",
  cursor: "pointer",
};
const textareaStyle = {
  width: "100%",
  height: "80px",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
};
const submitBtnStyle = {
  ...btnStyle,
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  marginLeft: "5px",
};
const cancelBtnStyle = { ...btnStyle, backgroundColor: "#eee", border: "none" };

export default OwnerReviewItem;
