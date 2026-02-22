import React, { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function ProductForm() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);

  // 1. 전체 폼 상태 관리 (옵션 그룹은 배열로 관리)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "MAIN", // 기존 카테고리 Enum에 맞춤
    stock: 100,
    optionGroups: [
      {
        name: "",
        isRequired: false,
        options: [{ name: "", additionalPrice: 0 }],
      },
    ],
  });

  // 옵션 그룹 추가
  const addOptionGroup = () => {
    setFormData({
      ...formData,
      optionGroups: [
        ...formData.optionGroups,
        {
          name: "",
          isRequired: false,
          options: [{ name: "", additionalPrice: 0 }],
        },
      ],
    });
  };

  // 특정 그룹 안에 옵션 항목 추가
  const addOptionItem = (groupIndex) => {
    const newGroups = [...formData.optionGroups];
    newGroups[groupIndex].options.push({ name: "", additionalPrice: 0 });
    setFormData({ ...formData, optionGroups: newGroups });
  };

  // 입력값 변경 처리 (중첩 구조)
  const handleOptionChange = (groupIndex, itemIndex, field, value) => {
    const newGroups = [...formData.optionGroups];
    if (itemIndex === null) {
      newGroups[groupIndex][field] = value; // 그룹 이름이나 필수 여부 변경
    } else {
      newGroups[groupIndex].options[itemIndex][field] = value; // 개별 옵션 이름/가격 변경
    }
    setFormData({ ...formData, optionGroups: newGroups });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // FormData 생성 (이미지 업로드가 포함되므로)
    const data = new FormData();
    data.append("image", image);

    // 백엔드 ProductCreateRequest 구조에 맞게 JSON 직렬화
    const jsonBlob = new Blob([JSON.stringify(formData)], {
      type: "application/json",
    });
    data.append("data", jsonBlob);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:8080/api/stores/${storeId}/products`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("메뉴가 등록되었습니다!");
      navigate(`/store/${storeId}`);
    } catch (error) {
      toast.error("등록 실패: " + error.response?.data?.message);
    }
  };

  return (
    <div
      className="product-form-container"
      style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}
    >
      <h2>새 메뉴 등록</h2>
      <form onSubmit={handleSubmit}>
        {/* 기본 정보 입력 필드들 (생략) */}
        <input
          type="text"
          placeholder="메뉴명"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="기본 가격"
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />
        <input type="file" onChange={(e) => setImage(e.target.files[0])} />

        <hr />
        <h3>옵션 설정</h3>
        {formData.optionGroups.map((group, gIdx) => (
          <div
            key={gIdx}
            className="option-group-box"
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "10px",
            }}
          >
            <input
              type="text"
              placeholder="옵션 그룹명 (예: 맵기 선택, 토핑 추가)"
              value={group.name}
              onChange={(e) =>
                handleOptionChange(gIdx, null, "name", e.target.value)
              }
            />
            <label>
              <input
                type="checkbox"
                onChange={(e) =>
                  handleOptionChange(gIdx, null, "isRequired", e.target.checked)
                }
              />{" "}
              필수 선택
            </label>

            <div style={{ marginLeft: "20px", marginTop: "10px" }}>
              {group.options.map((opt, oIdx) => (
                <div key={oIdx} style={{ marginBottom: "5px" }}>
                  <input
                    type="text"
                    placeholder="옵션명"
                    value={opt.name}
                    onChange={(e) =>
                      handleOptionChange(gIdx, oIdx, "name", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="추가 금액"
                    value={opt.additionalPrice}
                    onChange={(e) =>
                      handleOptionChange(
                        gIdx,
                        oIdx,
                        "additionalPrice",
                        e.target.value
                      )
                    }
                  />
                </div>
              ))}
              <button type="button" onClick={() => addOptionItem(gIdx)}>
                + 옵션 항목 추가
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addOptionGroup}
          style={{ backgroundColor: "#28a745", color: "white" }}
        >
          + 옵션 그룹 추가
        </button>

        <hr />
        <button
          type="submit"
          style={{ width: "100%", padding: "10px", fontSize: "1.1rem" }}
        >
          메뉴 등록 완료
        </button>
      </form>
    </div>
  );
}

export default ProductForm;
