import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import Pagination from "../components/Pagination";

function AdminUserPage() {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);

  const [condition, setCondition] = useState({
    keyword: "",
    role: "",
    status: "",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:8080/api/admin/users", {
        params: {
          page,
          size: 10,
          keyword: condition.keyword,
          role: condition.role,
          status: condition.status,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error("회원 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const updateStatus = async (userId, status) => {
    try {
      await axios.patch(
        `http://localhost:8080/api/admin/users/${userId}/status`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("상태 변경 완료");

      fetchUsers();
    } catch (err) {
      toast.error("상태 변경 실패");
    }
  };

  if (loading) {
    return <h3>조회 중...</h3>;
  }

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "30px auto",
      }}
    >
      <h1>회원 관리</h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <input
          placeholder="검색어"
          value={condition.keyword}
          onChange={(e) =>
            setCondition({
              ...condition,
              keyword: e.target.value,
            })
          }
        />

        <select
          value={condition.role}
          onChange={(e) =>
            setCondition({
              ...condition,
              role: e.target.value,
            })
          }
        >
          <option value="">전체 권한</option>
          <option value="USER">USER</option>
          <option value="STORE_OWNER">STORE_OWNER</option>
          <option value="RIDER">RIDER</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        <select
          value={condition.status}
          onChange={(e) =>
            setCondition({
              ...condition,
              status: e.target.value,
            })
          }
        >
          <option value="">전체 상태</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="WITHDRAWN">WITHDRAWN</option>
        </select>

        <button
          onClick={() => {
            setPage(0);
            fetchUsers();
          }}
        >
          검색
        </button>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>이메일</th>
            <th>닉네임</th>
            <th>권한</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>

              <td>{user.email}</td>

              <td>{user.nickname}</td>

              <td>{user.role}</td>

              <td>{user.status}</td>

              <td>
                <select
                  value={user.status}
                  onChange={(e) => {
                    const status = e.target.value;

                    if (status === user.status) {
                      return;
                    }

                    if (
                      status === "WITHDRAWN" &&
                      !window.confirm("정말 탈퇴 처리하시겠습니까?")
                    ) {
                      return;
                    }

                    if (
                      status === "SUSPENDED" &&
                      !window.confirm("정지 처리하시겠습니까?")
                    ) {
                      return;
                    }

                    updateStatus(user.id, status);
                  }}
                >
                  <option value="ACTIVE">ACTIVE</option>

                  <option value="SUSPENDED">SUSPENDED</option>

                  <option value="WITHDRAWN">WITHDRAWN</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default AdminUserPage;
