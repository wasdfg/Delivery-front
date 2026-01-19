import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import "./LoginPage.css";

function StoreCreatePage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("CHICKEN");
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // 미리보기 URL

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      toast.warn("가게 대표 이미지를 등록해주세요.");
      return;
    }

    const formData = new FormData();

    // 1. DTO 구성
    const storeRequest = {
      name,
      category,
      minOrderAmount: Math.max(0, parseInt(minOrderAmount)), // 음수 방지
      deliveryFee: Math.max(0, parseInt(deliveryFee)),
      address,
      phone,
      description,
    };

    // 2. JSON Blob 생성
    const jsonBlob = new Blob([JSON.stringify(storeRequest)], {
      type: "application/json",
    });

    formData.append("request", jsonBlob);
    formData.append("file", imageFile); // 백엔드 @RequestPart("file")와 매핑

    try {
      await axios.post("http://localhost:8080/api/stores", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("가게 등록이 완료되었습니다! 대박 나세요! 🎊");
      navigate("/");
    } catch (error) {
      console.error("가게 등록 실패", error);
      toast.error(error.response?.data?.message || "가게 등록에 실패했습니다.");
    }
  };

  return (
    <div className="login-page">
      <form
        className="login-form"
        onSubmit={handleSubmit}
        style={{ maxWidth: "600px" }}
      >
        <h1>내 가게 등록하기</h1>
        <p style={{ textAlign: "center", color: "#666" }}>
          상점 정보를 입력하여 입점을 신청하세요.
        </p>

        <div className="input-group">
          <label>가게 이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="가게명을 입력하세요"
          />
        </div>

        <div className="input-group">
          <label>카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-select"
          >
            <option value="CHICKEN">치킨</option>
            <option value="PIZZA">피자</option>
            <option value="KOREAN_FOOD">한식</option>
            <option value="CHINESE_FOOD">중식</option>
            <option value="JAPANESE_FOOD">일식</option>
            <option value="FAST_FOOD">패스트푸드</option>
            <option value="CAFE_DESSERT">카페/디저트</option>
          </select>
        </div>

        <div className="input-group">
          <label>가게 대표 이미지</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          {previewUrl && (
            <div
              className="preview-container"
              style={{ marginTop: "10px", textAlign: "center" }}
            >
              <img
                src={previewUrl}
                alt="가게 미리보기"
                style={{
                  width: "100%",
                  maxHeight: "180px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>최소 주문 금액 (원)</label>
            <input
              type="number"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              min="0"
            />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>배달비 (원)</label>
            <input
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="input-group">
          <label>가게 주소</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            placeholder="상세 주소를 입력하세요"
          />
        </div>

        <div className="input-group">
          <label>가게 연락처</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="02-000-0000"
          />
        </div>

        <button
          type="submit"
          className="login-button"
          style={{ marginTop: "10px" }}
        >
          가게 등록 신청
        </button>
      </form>
    </div>
  );
}

export default StoreCreatePage;
