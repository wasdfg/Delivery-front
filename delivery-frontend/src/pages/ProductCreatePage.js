import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./LoginPage.css"; // 스타일 재사용

function ProductCreatePage() {
  const { storeId } = useParams(); // URL에서 가게 ID 가져오기
  const { token } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    // 1. DTO 객체 생성 (백엔드 ProductRequestDto와 필드명 일치해야 함)
    const productRequest = {
      name: name,
      price: parseInt(price),
      description: description,
      // storeId는 URL에 있으므로 DTO에 포함 여부는 백엔드 스펙에 따라 다름.
      // 보통은 URL 경로로 파악하므로 안 보내도 되는 경우가 많음.
    };

    // 2. JSON을 Blob으로 변환하여 'request'로 추가 (가게 등록 때와 동일)
    const jsonBlob = new Blob([JSON.stringify(productRequest)], {
      type: "application/json",
    });
    formData.append("request", jsonBlob);

    // 3. 이미지 파일 추가 ('image'로 추가)
    if (imageFile) {
      formData.append("image", imageFile);
    } else {
      alert("메뉴 이미지는 필수입니다.");
      return;
    }

    try {
      // 4. 메뉴 등록 API 호출
      // URL 예시: POST /api/stores/{storeId}/products
      await axios.post(
        `http://localhost:8080/api/stores/${storeId}/products`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("메뉴 등록이 완료되었습니다!");
      navigate(`/store/${storeId}`); // 등록 후 해당 가게 상세 페이지로 이동
    } catch (error) {
      console.error("메뉴 등록 실패", error);
      alert("메뉴 등록에 실패했습니다.");
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>메뉴 등록</h1>

        <div className="input-group">
          <label>메뉴 이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>가격</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
          />
        </div>

        <div className="input-group">
          <label>메뉴 이미지</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
        </div>

        <button type="submit" className="login-button">
          메뉴 등록하기
        </button>
      </form>
    </div>
  );
}

export default ProductCreatePage;
