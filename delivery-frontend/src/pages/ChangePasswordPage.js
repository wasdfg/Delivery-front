import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./ChangePasswordPage.css";

function ChangePasswordPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: "",
    toChangePassword1: "",
    toChangePassword2: "",
  });

  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const validate = () => {
    if (
      !formData.currentPassword ||
      !formData.toChangePassword1 ||
      !formData.toChangePassword2
    ) {
      toast.error("모든 항목을 입력해주세요.");
      return false;
    }

    if (formData.toChangePassword1.length < 4) {
      toast.error("비밀번호는 최소 4자 이상이어야 합니다.");
      return false;
    }

    if (formData.toChangePassword1 !== formData.toChangePassword2) {
      toast.error("새 비밀번호가 일치하지 않습니다.");
      return false;
    }

    if (formData.currentPassword === formData.toChangePassword1) {
      toast.error("기존 비밀번호와 동일합니다.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      await axios.post(
        "http://localhost:8080/api/users/changePassword",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("비밀번호가 변경되었습니다. 다시 로그인해주세요.");

      localStorage.removeItem("token");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      const msg =
        err.response?.data?.message || "비밀번호 변경에 실패했습니다.";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <form className="change-password-form" onSubmit={handleSubmit}>
        <h1>비밀번호 변경</h1>

        <div className="input-group">
          <label>현재 비밀번호</label>

          <input
            type="password"
            id="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label>새 비밀번호</label>

          <input
            type="password"
            id="toChangePassword1"
            value={formData.toChangePassword1}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label>새 비밀번호 확인</label>

          <input
            type="password"
            id="toChangePassword2"
            value={formData.toChangePassword2}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          className="change-password-button"
          disabled={loading}
        >
          {loading ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordPage;
