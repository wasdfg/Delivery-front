import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

function AdminUserDetailPage() {
  const { userId } = useParams();

  const { token } = useAuth();

  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/admin/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUser(res.data);
    } catch {
      toast.error("회원 조회 실패");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (!user) {
    return <div>불러오는 중...</div>;
  }

  return (
    <div style={{ maxWidth: "700px", margin: "30px auto" }}>
      <h1>회원 상세</h1>

      <table>
        <tbody>
          <tr>
            <th>ID</th>
            <td>{user.id}</td>
          </tr>

          <tr>
            <th>닉네임</th>
            <td>{user.nickname}</td>
          </tr>

          <tr>
            <th>이메일</th>
            <td>{user.email}</td>
          </tr>

          <tr>
            <th>로그인 ID</th>
            <td>{user.idForLogin}</td>
          </tr>

          <tr>
            <th>권한</th>
            <td>{user.role}</td>
          </tr>

          <tr>
            <th>상태</th>
            <td>{user.status}</td>
          </tr>

          <tr>
            <th>가입일</th>
            <td>{user.createdAt}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default AdminUserDetailPage;
