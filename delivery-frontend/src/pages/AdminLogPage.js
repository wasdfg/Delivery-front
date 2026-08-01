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

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:8080/api/admin/logs", {
        params: {
          page,
          size: 10,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLogs(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error("로그 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const formatDate = (date) => {
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

      {loading && <p>불러오는 중...</p>}

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
          {logs.map((log) => (
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
          ))}
        </tbody>
      </table>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default AdminLogPage;
