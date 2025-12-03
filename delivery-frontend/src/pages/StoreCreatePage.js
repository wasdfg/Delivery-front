import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./LoginPage.css"; // 스타일은 로그인 폼과 비슷하니 재사용 (또는 새로 생성)

function StoreCreatePage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  // 1. 가게 정보 State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("CHICKEN"); // 기본값
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // 2. 이미지 파일 State (문자열이 아니라 File 객체)
  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]); // 파일 객체 저장
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 3. 파일 업로드를 위해 FormData 사용 (JSON이 아님!)
    const formData = new FormData();

    const storeRequest = {
      name: name,
      category: category, // 백엔드 Enum 값과 일치해야 함
      minOrderAmount: parseInt(minOrderAmount), // 숫자로 변환
      deliveryFee: parseInt(deliveryFee), // 숫자로 변환
      address: address,
      phone: phone,
      description: description,
    };

    const jsonBlob = new Blob([JSON.stringify(storeRequest)], {
      type: "application/json",
    });
    formData.append("request", jsonBlob);

    if (imageFile) {
      formData.append("file", imageFile); // 백엔드 파라미터명('file' 또는 'image') 확인 필수!
    } else {
      // 이미지가 필수라면 여기서 경고를 띄우거나 리턴해야 함
      alert("가게 이미지는 필수입니다.");
      return;
    }

    try {
      await axios.post("http://localhost:8080/api/stores", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // 👈 중요: 파일 전송 시 필수
        },
      });

      alert("가게 등록이 완료되었습니다!");
      navigate("/"); // 홈으로 이동
    } catch (error) {
      console.error("가게 등록 실패", error);
      alert("가게 등록에 실패했습니다. (권한이 없거나 입력 오류)");
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>가게 등록 (사장님)</h1>

        <div className="input-group">
          <label>가게 이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
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
        </div>

        <div className="input-group">
          <label>최소 주문 금액</label>
          <input
            type="number"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>배달비</label>
          <input
            type="number"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>주소</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>전화번호</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <button type="submit" className="login-button">
          가게 등록하기
        </button>
      </form>
    </div>
  );
}

export default StoreCreatePage;
