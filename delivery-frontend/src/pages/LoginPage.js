import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext"; // 1. AuthContext 훅
import axios from "axios";
import { useNavigate } from "react-router-dom"; // 2. 페이지 이동을 위한 훅
import "./LoginPage.css"; // 3. 로그인 페이지용 CSS

function LoginPage() {
  // 4. 이메일, 비밀번호 입력을 위한 state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null); // 5. 에러 메시지 state

  const { login } = useAuth(); // 6. AuthContext에서 login 함수 가져오기
  const navigate = useNavigate(); // 7. 페이지 이동 함수

  // 8. 폼 제출(로그인 버튼 클릭) 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault(); // 폼 기본 동작(새로고침) 방지
    setError(null); // 기존 에러 초기화

    try {
      // 9. 백엔드 로그인 API 호출
      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        {
          email: email,
          password: password,
        }
      );

      // 10. 백엔드에서 토큰을 성공적으로 받았다면
      const token = response.data.token; // (DTO 필드명은 'token'이라고 가정)

      // 11. AuthContext의 login 함수를 호출해 토큰을 글로벌하게 저장
      login(token);

      // 12. 로그인 성공 시 홈('/') 페이지로 이동
      navigate("/");
    } catch (err) {
      // 13. 로그인 실패 시 (예: 401 Unauthorized)
      console.error("로그인 실패:", err);
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>로그인</h1>

        {/* 에러 메시지 표시 */}
        {error && <p className="error-message">{error}</p>}

        <div className="input-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">
          로그인
        </button>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          계정이 없으신가요?{" "}
          <Link to="/signup" style={{ color: "#333", fontWeight: "bold" }}>
            회원가입
          </Link>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
