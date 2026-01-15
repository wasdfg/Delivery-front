import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; // 👈 Link 추가
import "./LoginPage.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // 👈 로딩 상태 추가

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true); // 로딩 시작

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        { email, password }
      );

      // ✅ 백엔드에서 token과 role을 함께 받는다고 가정
      const { token, role } = response.data;

      // ✅ login 함수에 권한 정보도 함께 전달하도록 설계 보완 권장
      login(token, role);

      // 성공 알림 (선택 사항)
      console.log("로그인 성공");
      navigate("/");
    } catch (err) {
      console.error("로그인 실패:", err);
      // 서버에서 보내주는 구체적인 에러 메시지가 있다면 표시, 없으면 기본 메시지
      setError(
        err.response?.data?.message ||
          "이메일 또는 비밀번호가 올바르지 않습니다."
      );
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>로그인</h1>

        {error && (
          <p
            className="error-message"
            style={{ color: "red", fontSize: "0.9rem" }}
          >
            {error}
          </p>
        )}

        <div className="input-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            name="email" // 자동완성 도움
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@mail.com"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="비밀번호를 입력하세요"
          />
        </div>

        <button
          type="submit"
          className="login-button"
          disabled={isLoading} // 👈 로그인 중 버튼 중복 클릭 방지
          style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
        >
          {isLoading ? "로그인 중..." : "로그인"}
        </button>

        <div
          style={{ marginTop: "20px", textAlign: "center", fontSize: "0.9rem" }}
        >
          계정이 없으신가요?{" "}
          <Link
            to="/signup"
            style={{
              color: "#007bff",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            회원가입
          </Link>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
