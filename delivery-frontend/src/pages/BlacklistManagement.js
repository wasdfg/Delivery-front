import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function BlacklistManagement({ storeId }) {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlacklist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:8080/api/stores/${storeId}/blacklist`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBlacklist(res.data);
    } catch (error) {
      toast.error("차단 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, [storeId]);

  const handleUnblock = async (userId, nickname) => {
    if (!window.confirm(`${nickname}님을 차단 해제하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:8080/api/stores/${storeId}/blacklist/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("차단이 해제되었습니다.");
      fetchBlacklist(); // 목록 새로고침
    } catch (error) {
      toast.error("차단 해제 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>데이터 로딩 중...</div>;

  return (
    <div style={containerStyle}>
      <h2 style={{ marginBottom: "20px" }}>🚫 차단 유저 관리</h2>

      {blacklist.length === 0 ? (
        <div style={emptyMessageStyle}>차단된 유저가 없습니다.</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={theadTrStyle}>
              <th style={thStyle}>닉네임</th>
              <th style={thStyle}>차단 사유</th>
              <th style={thStyle}>차단 일자</th>
              <th style={thStyle}>액션</th>
            </tr>
          </thead>
          <tbody>
            {blacklist.map((user) => (
              <tr key={user.userId} style={trStyle}>
                <td style={tdStyle}>{user.userNickname}</td>
                <td style={tdStyle}>{user.reason || "사유 없음"}</td>
                <td style={tdStyle}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() =>
                      handleUnblock(user.userId, user.userNickname)
                    }
                    style={unblockBtnStyle}
                  >
                    차단 해제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// --- 스타일링 객체 ---
const containerStyle = {
  padding: "20px",
  backgroundColor: "#fff",
  borderRadius: "8px",
};
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px",
};
const emptyMessageStyle = {
  padding: "40px",
  textAlign: "center",
  color: "#888",
  border: "1px dashed #ddd",
  borderRadius: "8px",
};
const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "2px solid #eee",
  color: "#666",
};
const tdStyle = { padding: "12px", borderBottom: "1px solid #f5f5f5" };
const theadTrStyle = { backgroundColor: "#fafafa" };
const trStyle = { transition: "background-color 0.2s" };
const unblockBtnStyle = {
  backgroundColor: "#fff",
  color: "#1976d2",
  border: "1px solid #1976d2",
  padding: "5px 12px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: "bold",
};

export default BlacklistManagement;
