import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function AdminReportDetailPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [comment, setComment] = useState("");

  const getReport = async () => {
    try {
      const response = await axios.get(`/api/admin/reports/${reportId}`);

      setReport(response.data);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message || "신고 정보를 불러오지 못했습니다.",
      );
    }
  };

  useEffect(() => {
    getReport();
  }, [reportId]);

  const handleStart = async () => {
    try {
      await axios.patch(`/api/admin/reports/${reportId}/start`);

      alert("신고 처리를 시작했습니다.");

      await getReport();
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "처리 시작에 실패했습니다.");
    }
  };

  const handleResolve = async () => {
    if (!comment.trim()) {
      alert("처리 내용을 입력해주세요.");
      return;
    }

    try {
      await axios.patch(`/api/admin/reports/${reportId}/resolve`, {
        comment,
      });

      alert("신고 처리가 완료되었습니다.");

      setComment("");

      await getReport();
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "신고 처리에 실패했습니다.");
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      alert("반려 사유를 입력해주세요.");
      return;
    }

    try {
      await axios.patch(`/api/admin/reports/${reportId}/reject`, {
        comment,
      });

      alert("신고를 반려했습니다.");

      setComment("");

      await getReport();
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "신고 반려에 실패했습니다.");
    }
  };

  const getTargetTypeName = (type) => {
    const names = {
      REVIEW: "리뷰",
      ORDER: "주문",
      STORE: "가게",
      RIDER: "라이더",
      USER: "회원",
    };

    return names[type] || type;
  };

  const getReportTypeName = (type) => {
    const names = {
      ABUSE: "욕설/비방",
      INAPPROPRIATE_CONTENT: "부적절한 내용",
      FALSE_INFORMATION: "허위 정보",
      ADVERTISEMENT: "광고/홍보",
      PRIVACY_VIOLATION: "개인정보 노출",
      ORDER_PROBLEM: "주문 문제",
      DELIVERY_PROBLEM: "배송 문제",
      STORE_PROBLEM: "가게 문제",
      RIDER_PROBLEM: "라이더 문제",
      OTHER: "기타",
    };

    return names[type] || type;
  };

  const getStatusName = (status) => {
    const names = {
      WAITING: "접수",
      IN_PROGRESS: "처리중",
      RESOLVED: "처리완료",
      REJECTED: "반려",
    };

    return names[status] || status;
  };

  if (!report) {
    return <div>신고 정보를 불러오는 중...</div>;
  }

  return (
    <div>
      <h1>신고 상세</h1>

      <div>신고번호 : {report.id}</div>

      <div>신고자 : {report.reporterNickname}</div>

      <div>대상 : {getTargetTypeName(report.targetType)}</div>

      <div>대상 ID : {report.targetId}</div>

      <div>신고 유형 : {getReportTypeName(report.reportType)}</div>

      <div>신고 내용</div>

      <div>{report.description}</div>

      <div>상태 : {getStatusName(report.status)}</div>

      <div>신고일 : {report.createdAt}</div>

      {report.adminComment && (
        <div>
          <div>관리자 처리 내용</div>
          <div>{report.adminComment}</div>
        </div>
      )}

      {/* 처리 시작 */}
      {report.status === "WAITING" && (
        <button type="button" onClick={handleStart}>
          처리 시작
        </button>
      )}

      {/* 처리 / 반려 */}
      {report.status === "IN_PROGRESS" && (
        <div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="처리 내용 또는 반려 사유를 입력해주세요."
            rows={6}
          />

          <div>
            <button type="button" onClick={handleResolve}>
              처리 완료
            </button>

            <button type="button" onClick={handleReject}>
              반려
            </button>
          </div>
        </div>
      )}

      <button type="button" onClick={() => navigate("/admin/reports")}>
        목록
      </button>
    </div>
  );
}

export default AdminReportDetailPage;
