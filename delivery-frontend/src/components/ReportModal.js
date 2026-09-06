import React, { useState } from "react";
import axios from "axios";

const REPORT_TYPES = {
  REVIEW: [
    ["ABUSE", "욕설/비방"],
    ["INAPPROPRIATE_CONTENT", "부적절한 내용"],
    ["FALSE_INFORMATION", "허위 정보"],
    ["ADVERTISEMENT", "광고/홍보"],
    ["PRIVACY_VIOLATION", "개인정보 노출"],
    ["OTHER", "기타"],
  ],

  ORDER: [
    ["ORDER_PROBLEM", "주문 문제"],
    ["OTHER", "기타"],
  ],

  STORE: [
    ["STORE_PROBLEM", "가게 문제"],
    ["ADVERTISEMENT", "광고/홍보"],
    ["OTHER", "기타"],
  ],

  RIDER: [
    ["DELIVERY_PROBLEM", "배송 문제"],
    ["RIDER_PROBLEM", "라이더 문제"],
    ["OTHER", "기타"],
  ],

  USER: [
    ["ABUSE", "욕설/비방"],
    ["PRIVACY_VIOLATION", "개인정보 노출"],
    ["ADVERTISEMENT", "광고/홍보"],
    ["OTHER", "기타"],
  ],
};

function ReportModal({ targetType, targetId, onClose }) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reportTypes = REPORT_TYPES[targetType] || [];

  const handleSubmit = async () => {
    if (!type) {
      alert("신고 유형을 선택해주세요.");
      return;
    }

    if (!description.trim()) {
      alert("신고 내용을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      await axios.post("/api/reports", {
        targetType,
        targetId,
        type,
        description,
      });

      alert("신고가 접수되었습니다.");

      onClose();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message || "신고 접수 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-modal-overlay">
      <div className="report-modal">
        <h2>신고하기</h2>

        <div>
          <label>신고 유형</label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={loading}
          >
            <option value="">신고 유형을 선택해주세요.</option>

            {reportTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>신고 내용</label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="신고 사유를 입력해주세요."
            rows={6}
            disabled={loading}
          />
        </div>

        <div>
          <button type="button" onClick={onClose} disabled={loading}>
            취소
          </button>

          <button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "신고 중..." : "신고하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;
