import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./LoginPage.css";

function SignUpPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    idForLogin: "",
    nickname: "",
    password: "",
    confirmPassword: "",
    address: "",
    phone: "",
    role: "USER",
  });

  const [error, setError] = useState(null);

  // =========================
  // 입력값 변경
  // =========================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  // =========================
  // 회원가입
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);

    // =========================
    // 유효성 검사
    // =========================

    if (!formData.email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!formData.idForLogin.trim()) {
      setError("아이디를 입력해주세요.");
      return;
    }

    if (!formData.nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    if (formData.password.length < 4) {
      setError("비밀번호는 최소 4자 이상이어야 합니다.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      // =========================
      // 회원가입 요청
      // =========================
      await axios.post("http://localhost:8080/api/users/signup", {
        email: formData.email,
        idForLogin: formData.idForLogin,
        nickname: formData.nickname,
        password: formData.password,
        address: formData.address,
        phone: formData.phone,
        role: formData.role,
      });

      toast.success("회원가입이 완료되었습니다.");

      // 로그인 페이지 이동
      navigate("/login", {
        state: {
          idForLogin: formData.idForLogin,
        },
      });
    } catch (err) {
      const msg =
        err.response?.data?.message || "회원가입 중 오류가 발생했습니다.";

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
        <h1>회원가입</h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "20px",
          }}
        >
          회원 정보를 입력해주세요.
        </p>

        {/* ========================= */}
        {/* 에러 메시지 */}
        {/* ========================= */}
        {error && (
          <p
            className="error-message"
            style={{
              color: "red",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        {/* ========================= */}
        {/* 역할 선택 */}
        {/* ========================= */}
        <div
          className="role-selector"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          {[
            {
              value: "USER",
              label: "일반회원",
            },
            {
              value: "STORE_OWNER",
              label: "사장님",
            },
            {
              value: "RIDER",
              label: "라이더",
            },
          ].map((role) => (
            <label
              key={role.value}
              style={{
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                id="role"
                name="role"
                value={role.value}
                checked={formData.role === role.value}
                onChange={handleChange}
              />{" "}
              {role.label}
            </label>
          ))}
        </div>

        {/* ========================= */}
        {/* 이메일 */}
        {/* ========================= */}
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

        {/* ========================= */}
        {/* 로그인 아이디 */}
        {/* ========================= */}
        <div className="input-group">
          <label htmlFor="idForLogin">아이디</label>

          <input
            type="text"
            id="idForLogin"
            value={formData.idForLogin}
            onChange={handleChange}
            required
            placeholder="로그인 아이디 입력"
          />
        </div>

        {/* ========================= */}
        {/* 닉네임 */}
        {/* ========================= */}
        <div className="input-group">
          <label htmlFor="nickname">닉네임</label>

          <input
            type="text"
            id="nickname"
            value={formData.nickname}
            onChange={handleChange}
            required
            placeholder="닉네임 입력"
          />
        </div>

        {/* ========================= */}
        {/* 비밀번호 */}
        {/* ========================= */}
        <div className="input-group">
          <label htmlFor="password">비밀번호</label>

          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="비밀번호 입력"
          />
        </div>

        {/* ========================= */}
        {/* 비밀번호 확인 */}
        {/* ========================= */}
        <div className="input-group">
          <label htmlFor="confirmPassword">비밀번호 확인</label>

          <input
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="비밀번호 다시 입력"
          />
        </div>

        {/* ========================= */}
        {/* 전화번호 */}
        {/* ========================= */}
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

        {/* ========================= */}
        {/* 주소 */}
        {/* ========================= */}
        <div className="input-group">
          <label htmlFor="address">주소</label>

          <input
            type="text"
            id="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="기본 배송 주소 입력"
          />
        </div>

        {/* ========================= */}
        {/* 회원가입 버튼 */}
        {/* ========================= */}
        <button
          type="submit"
          className="login-button"
          style={{ marginTop: "20px" }}
        >
          회원가입
        </button>

        {/* ========================= */}
        {/* 로그인 이동 */}
        {/* ========================= */}
        <div
          style={{
            textAlign: "center",
            marginTop: "15px",
          }}
        >
          <span
            style={{
              fontSize: "0.9rem",
              color: "#888",
            }}
          >
            이미 계정이 있으신가요?
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
              marginLeft: "5px",
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
