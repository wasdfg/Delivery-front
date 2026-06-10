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
  const [categoryId, setCategoryId] = useState(1);

  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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

    const storeRequest = {
      name,
      address,
      phone,
      description,

      minOrderAmount: minOrderAmount === "" ? 0 : Number(minOrderAmount),

      deliveryFee: deliveryFee === "" ? 0 : Number(deliveryFee),

      categoryId,

      operationTimes: [],
    };

    const jsonBlob = new Blob([JSON.stringify(storeRequest)], {
      type: "application/json",
    });

    formData.append("request", jsonBlob);
    formData.append("image", imageFile);

    try {
      await axios.post("http://localhost:8080/api/stores", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("가게 등록이 완료되었습니다! 🎉");

      navigate("/");
    } catch (error) {
      console.error(error);

      toast.error(error.response?.data?.message ?? "가게 등록에 실패했습니다.");
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

        <p
          style={{
            textAlign: "center",
            color: "#666",
          }}
        >
          상점 정보를 입력하여 등록하세요.
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
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
          >
            <option value={1}>치킨</option>
            <option value={2}>피자</option>
            <option value={3}>한식</option>
            <option value={4}>중식</option>
            <option value={5}>일식</option>
            <option value={6}>패스트푸드</option>
            <option value={7}>카페/디저트</option>
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
              style={{
                marginTop: "10px",
                textAlign: "center",
              }}
            >
              <img
                src={previewUrl}
                alt="미리보기"
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

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <div className="input-group" style={{ flex: 1 }}>
            <label>최소 주문 금액</label>

            <input
              type="number"
              min="0"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ flex: 1 }}>
            <label>배달비</label>

            <input
              type="number"
              min="0"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
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
            placeholder="02-0000-0000"
          />
        </div>

        <div className="input-group">
          <label>가게 소개</label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="가게 소개를 입력해주세요."
          />
        </div>

        <button type="submit" className="login-button">
          가게 등록
        </button>
      </form>
    </div>
  );
}

export default StoreCreatePage;
