import React, { createContext, useContext, useState } from "react";

// 1. Context 생성
const AuthContext = createContext();

// 2. 커스텀 훅
export function useAuth() {
  return useContext(AuthContext);
}

// 3. Provider 컴포넌트
export function AuthProvider({ children }) {
  // 4. 로그인 토큰을 state로 관리
  // (페이지를 새로고침해도 유지되도록 localStorage에서 초기값을 가져옵니다)
  const [token, setToken] = useState(localStorage.getItem("authToken"));

  // 5. 로그인 함수: 토큰을 받아서 state와 localStorage에 저장
  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem("authToken", newToken);
  };

  // 6. 로그아웃 함수: state와 localStorage에서 토큰 제거
  const logout = () => {
    setToken(null);
    localStorage.removeItem("authToken");
  };

  // 7. 자식들에게 전달할 값들
  const value = {
    token,
    isLoggedIn: !!token, // 👈 토큰이 있으면 true, 없으면 false
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
