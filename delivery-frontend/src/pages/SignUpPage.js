import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // 일관된 알림 스타일
import "./LoginPage.css";

function SignUpPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    address: "",
    phone: "",
    role: "USER", // 👈 기본 역할 설정 (USER, OWNER, RIDER)
  });

  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 1. 유효성 검사
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (formData.password.length < 4) {
      setError("비밀번호는 최소 4자 이상이어야 합니다.");
      return;
    }

    try {
      // 2. API 호출 (역할 정보 포함)
      await axios.post("http://localhost:8080/api/users/signup", {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        role: formData.role, // 👈 백엔드에서 권한 분리용
      });

      toast.success("가입을 축하드립니다! 로그인해주세요.");
      // 가입한 이메일 정보를 들고 로그인 페이지로 이동
      navigate("/login", { state: { email: formData.email } });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "이미 가입된 이메일이거나 형식이 잘못되었습니다.";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="login-page">
      <form
        className="login-form"
        onSubmit={handleSubmit}
        style={{ maxWidth: "450px" }}
      >
        <h1>서비스 시작하기</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "20px" }}>
          회원 정보를 입력하여 가입을 완료해주세요.
        </p>

        {error && (
          <p
            className="error-message"
            style={{ color: "red", textAlign: "center" }}
          >
            {error}
          </p>
        )}

        {/* 역할 선택 - 라디오 버튼 형태 */}
        <div
          className="role-selector"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          {["USER", "OWNER", "RIDER"].map((r) => (
            <label key={r} style={{ fontSize: "0.9rem", cursor: "pointer" }}>
              <input
                type="radio"
                id="role"
                name="role"
                value={r}
                checked={formData.role === r}
                onChange={handleChange}
              />
              {r === "USER"
                ? " 일반회원"
                : r === "OWNER"
                ? " 사장님"
                : " 라이더"}
            </label>
          ))}
        </div>

        <div className="input-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="example@email.com"
          />
        </div>

        <div className="input-group">
          <label htmlFor="name">이름 (닉네임)</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="홍길동"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="confirmPassword">비밀번호 확인</label>
          <input
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="phone">전화번호</label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="010-0000-0000"
          />
        </div>

        <div className="input-group">
          <label htmlFor="address">기본 배송 주소</label>
          <input
            type="text"
            id="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="주소를 입력하세요"
          />
        </div>

        <button
          type="submit"
          className="login-button"
          style={{ marginTop: "20px" }}
        >
          가입 완료
        </button>

        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <span style={{ fontSize: "0.9rem", color: "#888" }}>
            이미 계정이 있으신가요?{" "}
          </span>
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              background: "none",
              border: "none",
              color: "#339af0",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            로그인하기
          </button>
        </div>
      </form>
    </div>
  );
}

export default SignUpPage;
