import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

function AdminUserPage() {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/admin/users?page=${page}&size=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUsers(res.data.content);
    } catch (err) {
      toast.error("회원 조회 실패");
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

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "30px auto",
      }}
    >
      <h1>회원 관리</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th>ID</th>
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

              <td>{user.nickname}</td>

              <td>{user.role}</td>

              <td>{user.status}</td>

              <td>
                <select
                  value={user.status}
                  onChange={(e) => updateStatus(user.id, e.target.value)}
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

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "10px",
        }}
      >
        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          이전
        </button>

        <button onClick={() => setPage((p) => p + 1)}>다음</button>
      </div>
    </div>
  );
}

export default AdminUserPage;
