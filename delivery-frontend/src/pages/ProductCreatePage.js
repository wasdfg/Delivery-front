import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./LoginPage.css";

function ProductCreatePage() {
  const { storeId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // 👈 미리보기 URL 추가

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // 👈 파일 선택 시 미리보기 생성
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      alert("메뉴 이미지는 필수입니다.");
      return;
    }

    const formData = new FormData();

    // 1. DTO 객체 생성
    const productRequest = {
      name: name,
      price: Number(price), // 👈 parseInt보다 안전한 Number 사용
      description: description,
    };

    // 2. JSON을 Blob으로 변환 ('request')
    const jsonBlob = new Blob([JSON.stringify(productRequest)], {
      type: "application/json",
    });
    formData.append("request", jsonBlob);

    // 3. 이미지 파일 추가 ('image')
    formData.append("image", imageFile);

    try {
      await axios.post(
        `http://localhost:8080/api/stores/${storeId}/products`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // "Content-Type"은 axios가 FormData를 보고 자동으로 경계값(boundary)을 설정하므로 생략 가능하지만 명시해도 좋습니다.
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("메뉴가 성공적으로 등록되었습니다! ✨");
      navigate(`/store/${storeId}`);
    } catch (error) {
      console.error("메뉴 등록 실패", error);
      alert(
        error.response?.data?.message || "메뉴 등록 중 오류가 발생했습니다."
      );
    }
  };

  return (
    <div className="login-page">
      <form
        className="login-form"
        onSubmit={handleSubmit}
        style={{ maxWidth: "500px" }}
      >
        <h1>새 메뉴 등록</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "20px" }}>
          가게의 맛있는 메뉴를 소개해 보세요!
        </p>

        <div className="input-group">
          <label>메뉴 이름</label>
          <input
            type="text"
            placeholder="예: 매콤 떡볶이"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>가격 (원)</label>
          <input
            type="number"
            placeholder="가격을 입력하세요"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>설명</label>
          <textarea
            placeholder="메뉴에 대한 설명을 적어주세요."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
        </div>

        <div className="input-group">
          <label>메뉴 이미지</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
            style={{ marginBottom: "10px" }}
          />
          {/* ✅ 미리보기 영역 추가 */}
          {previewUrl && (
            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <img
                src={previewUrl}
                alt="미리보기"
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="login-button"
          style={{ marginTop: "20px" }}
        >
          등록 완료
        </button>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="login-button"
          style={{ backgroundColor: "#ccc", marginTop: "10px" }}
        >
          취소
        </button>
      </form>
    </div>
  );
}

export default ProductCreatePage;
