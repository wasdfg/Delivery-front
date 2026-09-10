import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminReportPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);

  const [condition, setCondition] = useState({
    targetType: "",
    reportType: "",
    status: "",
    targetId: "",
    reporterKeyword: "",
    startDate: "",
    endDate: "",
  });

  const [page, setPage] = useState(0);

  useEffect(() => {
    getReports();
  }, [page]);

  const getReports = async () => {
    try {
      const params = {
        page,
        size: 10,
        sort: "createdAt,desc",
      };

      Object.entries(condition).forEach(([key, value]) => {
        if (value !== "") {
          params[key] = value;
        }
      });

      const response = await axios.get("/api/admin/reports", { params });

      setReports(response.data.content);
      setPageInfo(response.data);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message || "신고 목록을 불러오지 못했습니다.",
      );
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setCondition((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    if (page === 0) {
      getReports();
    } else {
      setPage(0);
    }
  };

  const handleReset = () => {
    setCondition({
      targetType: "",
      reportType: "",
      status: "",
      targetId: "",
      reporterKeyword: "",
      startDate: "",
      endDate: "",
    });

    if (page === 0) {
      setTimeout(() => {
        getReports();
      }, 0);
    } else {
      setPage(0);
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

  return (
    <div>
      <h1>신고 관리</h1>

      {/* 검색 영역 */}
      <div>
        <select
          name="targetType"
          value={condition.targetType}
          onChange={handleChange}
        >
          <option value="">대상 전체</option>
          <option value="REVIEW">리뷰</option>
          <option value="ORDER">주문</option>
          <option value="STORE">가게</option>
          <option value="RIDER">라이더</option>
          <option value="USER">회원</option>
        </select>

        <select
          name="reportType"
          value={condition.reportType}
          onChange={handleChange}
        >
          <option value="">신고 유형 전체</option>
          <option value="ABUSE">욕설/비방</option>
          <option value="INAPPROPRIATE_CONTENT">부적절한 내용</option>
          <option value="FALSE_INFORMATION">허위 정보</option>
          <option value="ADVERTISEMENT">광고/홍보</option>
          <option value="PRIVACY_VIOLATION">개인정보 노출</option>
          <option value="ORDER_PROBLEM">주문 문제</option>
          <option value="DELIVERY_PROBLEM">배송 문제</option>
          <option value="STORE_PROBLEM">가게 문제</option>
          <option value="RIDER_PROBLEM">라이더 문제</option>
          <option value="OTHER">기타</option>
        </select>

        <select name="status" value={condition.status} onChange={handleChange}>
          <option value="">상태 전체</option>
          <option value="WAITING">접수</option>
          <option value="IN_PROGRESS">처리중</option>
          <option value="RESOLVED">처리완료</option>
          <option value="REJECTED">반려</option>
        </select>

        <input
          name="targetId"
          value={condition.targetId}
          onChange={handleChange}
          placeholder="대상 ID"
        />

        <input
          name="reporterKeyword"
          value={condition.reporterKeyword}
          onChange={handleChange}
          placeholder="신고자"
        />

        <input
          type="date"
          name="startDate"
          value={condition.startDate}
          onChange={handleChange}
        />

        <input
          type="date"
          name="endDate"
          value={condition.endDate}
          onChange={handleChange}
        />

        <button onClick={handleSearch}>검색</button>

        <button onClick={handleReset}>초기화</button>
      </div>

      {/* 목록 */}
      <table>
        <thead>
          <tr>
            <th>신고번호</th>
            <th>대상</th>
            <th>대상 ID</th>
            <th>신고 유형</th>
            <th>신고자</th>
            <th>상태</th>
            <th>신고일</th>
          </tr>
        </thead>

        <tbody>
          {reports.length === 0 ? (
            <tr>
              <td colSpan="7">신고 내역이 없습니다.</td>
            </tr>
          ) : (
            reports.map((report) => (
              <tr
                key={report.id}
                onClick={() => navigate(`/admin/reports/${report.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td>{report.id}</td>

                <td>{getTargetTypeName(report.targetType)}</td>

                <td>{report.targetId}</td>

                <td>{getReportTypeName(report.reportType)}</td>

                <td>{report.reporterNickname}</td>

                <td>{getStatusName(report.status)}</td>

                <td>{report.createdAt}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      {pageInfo && (
        <div>
          <button
            disabled={pageInfo.first}
            onClick={() => setPage((prev) => prev - 1)}
          >
            이전
          </button>

          <span>
            {pageInfo.number + 1}
            {" / "}
            {pageInfo.totalPages}
          </span>

          <button
            disabled={pageInfo.last}
            onClick={() => setPage((prev) => prev + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminReportPage;
