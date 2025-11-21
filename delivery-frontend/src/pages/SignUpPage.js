import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"; // 로그인 페이지 CSS를 재사용하면 편합니다!

function SignUpPage() {
  const navigate = useNavigate();

  // 1. 입력받을 정보들 (백엔드 DTO와 일치해야 함)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "", // 비밀번호 확인용
    name: "",
    address: "",
    phone: "",
  });

  const [error, setError] = useState(null);

  // 2. 입력값 변경 핸들러
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  // 3. 회원가입 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 비밀번호 확인 검증
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      // 4. 백엔드 회원가입 API 호출
      // (주소 확인 필요: /api/users/signup 또는 /api/auth/signup)
      await axios.post("http://localhost:8080/api/users/signup", {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        address: formData.address, // 필요하다면 전송
        phone: formData.phone, // 필요하다면 전송
      });

      alert("회원가입이 완료되었습니다! 로그인해주세요.");
      navigate("/login"); // 가입 성공 시 로그인 페이지로 이동
    } catch (err) {
      console.error("회원가입 실패:", err);
      // 백엔드에서 보내준 에러 메시지가 있다면 보여주기
      setError(err.response?.data?.message || "회원가입에 실패했습니다.");
    }
  };

  return (
    <div className="login-page">
      {" "}
      {/* CSS 재사용 */}
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>회원가입</h1>

        {error && <p className="error-message">{error}</p>}

        <div className="input-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
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

        {/* 추가 정보 (백엔드 스펙에 따라 선택사항) */}
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
          <label htmlFor="address">주소</label>
          <input
            type="text"
            id="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="서울시 강남구..."
          />
        </div>

        <button type="submit" className="login-button">
          가입하기
        </button>
      </form>
    </div>
  );
}

export default SignUpPage;
