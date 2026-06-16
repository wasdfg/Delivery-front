import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import "./LoginPage.css";

function WithdrawPage() {
  const navigate = useNavigate();

  const { token, logout } = useAuth();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // 회원 탈퇴
  // =========================
  const handleWithdraw = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.warn("비밀번호를 입력해주세요.");
      return;
    }

    const confirmed = window.confirm(
      "정말 탈퇴하시겠습니까?\n30일 이내 복구 가능합니다."
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        "http://localhost:8080/api/users/deleteUser",
        {
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("회원 탈퇴가 완료되었습니다.");

      logout();

      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.message || "회원 탈퇴 처리 중 오류가 발생했습니다.";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form
        className="login-form"
        onSubmit={handleWithdraw}
        style={{ maxWidth: "500px" }}
      >
        <h1>회원 탈퇴</h1>

        <div
          style={{
            background: "#fff3f3",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "14px",
            lineHeight: "1.8",
          }}
        >
          <div>⚠️ 탈퇴 전 안내</div>

          <ul
            style={{
              marginTop: "10px",
              paddingLeft: "20px",
            }}
          >
            <li>계정은 탈퇴 상태로 변경됩니다.</li>
            <li>30일 이내 복구 가능합니다.</li>
            <li>주문 내역 및 리뷰는 보관될 수 있습니다.</li>
            <li>탈퇴 후 다시 로그인할 수 없습니다.</li>
          </ul>
        </div>

        <div className="input-group">
          <label>비밀번호 확인</label>

          <input
            type="password"
            value={password}
            placeholder="현재 비밀번호 입력"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="login-button"
          disabled={loading}
          style={{
            marginTop: "15px",
            backgroundColor: "#ff4d4f",
          }}
        >
          {loading ? "처리 중..." : "회원 탈퇴"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/mypage")}
          style={{
            marginTop: "10px",
            width: "100%",
            padding: "12px",
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
            borderRadius: "8px",
          }}
        >
          취소
        </button>
      </form>
    </div>
  );
}

export default WithdrawPage;
