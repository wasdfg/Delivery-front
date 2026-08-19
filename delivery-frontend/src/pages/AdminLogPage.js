import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import Pagination from "../components/Pagination";

function AdminLogPage() {
  const { token } = useAuth();

  const [logs, setLogs] = useState([]);

  const [page, setPage] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);

  // 검색 조건
  const [condition, setCondition] = useState({
    adminKeyword: "",
    targetType: "",
    action: "",
    targetId: "",
    startDate: "",
    endDate: "",
  });

  const fetchLogs = async (searchCondition = condition) => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:8080/api/admin/logs", {
        params: {
          page,
          size: 10,

          adminKeyword: searchCondition.adminKeyword || null,

          targetType: searchCondition.targetType || null,

          action: searchCondition.action || null,

          targetId: searchCondition.targetId || null,

          startDate: searchCondition.startDate || null,

          endDate: searchCondition.endDate || null,
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLogs(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);

      toast.error(err.response?.data?.message ?? "로그 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  // 검색
  const handleSearch = () => {
    if (page !== 0) {
      setPage(0);
    } else {
      fetchLogs();
    }
  };

  // 검색 조건 초기화
  const handleReset = () => {
    const resetCondition = {
      adminKeyword: "",
      targetType: "",
      action: "",
      targetId: "",
      startDate: "",
      endDate: "",
    };

    setCondition(resetCondition);

    if (page !== 0) {
      setPage(0);
    } else {
      fetchLogs(resetCondition);
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString("ko-KR");
  };

  return (
    <div
      style={{
        maxWidth: "1300px",
        margin: "30px auto",
      }}
    >
      <h1>관리자 로그</h1>

      {/* 검색 영역 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        {/* 관리자 */}
        <input
          type="text"
          placeholder="관리자 닉네임 / ID"
          value={condition.adminKeyword}
          onChange={(e) =>
            setCondition({
              ...condition,
              adminKeyword: e.target.value,
            })
          }
        />

        {/* 대상 타입 */}
        <select
          value={condition.targetType}
          onChange={(e) =>
            setCondition({
              ...condition,
              targetType: e.target.value,
            })
          }
        >
          <option value="">전체 대상</option>
          <option value="USER">회원</option>
          <option value="STORE">가게</option>
          <option value="ORDER">주문</option>
        </select>

        {/* 작업 */}
        <select
          value={condition.action}
          onChange={(e) =>
            setCondition({
              ...condition,
              action: e.target.value,
            })
          }
        >
          <option value="">전체 작업</option>
          <option value="USER_STATUS_CHANGED">회원 상태 변경</option>
          <option value="STORE_STATUS_CHANGED">가게 상태 변경</option>
        </select>

        {/* 대상 ID */}
        <input
          type="number"
          placeholder="대상 ID"
          value={condition.targetId}
          onChange={(e) =>
            setCondition({
              ...condition,
              targetId: e.target.value,
            })
          }
        />

        {/* 시작일 */}
        <input
          type="date"
          value={condition.startDate}
          onChange={(e) =>
            setCondition({
              ...condition,
              startDate: e.target.value,
            })
          }
        />

        <span>~</span>

        {/* 종료일 */}
        <input
          type="date"
          value={condition.endDate}
          onChange={(e) =>
            setCondition({
              ...condition,
              endDate: e.target.value,
            })
          }
        />

        <button onClick={handleSearch}>검색</button>

        <button onClick={handleReset}>초기화</button>
      </div>

      {loading && <p>불러오는 중...</p>}

      {/* 로그 테이블 */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>관리자</th>
            <th>대상</th>
            <th>대상 ID</th>
            <th>작업</th>
            <th>설명</th>
            <th>변경</th>
            <th>시간</th>
          </tr>
        </thead>

        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td
                colSpan="8"
                style={{
                  textAlign: "center",
                  padding: "30px",
                }}
              >
                조회된 로그가 없습니다.
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>

                <td>{log.admin}</td>

                <td>{log.targetType}</td>

                <td>{log.targetId}</td>

                <td>{log.action}</td>

                <td>{log.description}</td>

                <td>
                  {log.beforeValue} → {log.afterValue}
                </td>

                <td>{formatDate(log.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 페이징 */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default AdminLogPage;
