import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const API_URL = "http://localhost:8080/api/delivery-addresses";

const createEmptyForm = () => ({
  name: "",
  receiverName: "",
  receiverPhone: "",
  address: "",
  detailAddress: "",
  defaultAddress: false,
});

function DeliveryAddressPage() {
  const { isLoggedIn, token } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // editingAddressId가 null이면 신규 등록, 값이 있으면 수정
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [formData, setFormData] = useState(createEmptyForm);

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // 1. 배송 주소 목록 조회
  const fetchAddresses = useCallback(async () => {
    if (!isLoggedIn || !token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      const addressList = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
          ? data.content
          : [];

      setAddresses(addressList);
    } catch (error) {
      console.error("배송 주소 목록 조회 실패:", error);
      alert("배송 주소 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, token]);

  useEffect(() => {
    if (!isLoggedIn || !token) {
      navigate("/login", { replace: true });
      return;
    }

    fetchAddresses();
  }, [isLoggedIn, token, navigate, fetchAddresses]);

  // 2. 입력값 변경
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 3. 입력 폼 초기화
  const resetForm = () => {
    setEditingAddressId(null);
    setFormData(createEmptyForm());
  };

  // 4. 수정할 주소 선택
  const handleEdit = (address) => {
    setEditingAddressId(address.id);

    setFormData({
      name: address.name || "",
      receiverName: address.receiverName || "",
      receiverPhone: address.receiverPhone || "",
      address: address.address || "",
      detailAddress: address.detailAddress || "",
      defaultAddress: Boolean(address.defaultAddress),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // 5. 주소 등록 및 수정
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("배송지 별칭을 입력해주세요.");
      return;
    }

    if (!formData.receiverName.trim()) {
      alert("수령인 이름을 입력해주세요.");
      return;
    }

    if (!formData.receiverPhone.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }

    if (!formData.address.trim()) {
      alert("주소를 입력해주세요.");
      return;
    }

    const requestData = {
      name: formData.name.trim(),
      receiverName: formData.receiverName.trim(),
      receiverPhone: formData.receiverPhone.trim(),
      address: formData.address.trim(),
      detailAddress: formData.detailAddress.trim(),
      defaultAddress: formData.defaultAddress,
    };

    setSaving(true);

    try {
      if (editingAddressId !== null) {
        await axios.patch(`${API_URL}/${editingAddressId}`, requestData, {
          headers,
        });

        alert("배송 주소가 수정되었습니다.");
      } else {
        await axios.post(API_URL, requestData, { headers });

        alert("배송 주소가 등록되었습니다.");
      }

      resetForm();
      await fetchAddresses();
    } catch (error) {
      console.error("배송 주소 저장 실패:", error);

      alert(error.response?.data?.message || "배송 주소 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 6. 주소 삭제
  const handleDelete = async (addressId) => {
    const confirmed = window.confirm("이 배송 주소를 삭제하시겠습니까?");

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${addressId}`, { headers });

      if (editingAddressId === addressId) {
        resetForm();
      }

      alert("배송 주소가 삭제되었습니다.");
      await fetchAddresses();
    } catch (error) {
      console.error("배송 주소 삭제 실패:", error);

      alert(error.response?.data?.message || "배송 주소 삭제에 실패했습니다.");
    }
  };

  // 7. 기본 배송지 설정
  const handleSetDefault = async (addressId) => {
    try {
      await axios.patch(`${API_URL}/${addressId}/default`, {}, { headers });

      alert("기본 배송지가 변경되었습니다.");
      await fetchAddresses();
    } catch (error) {
      console.error("기본 배송지 변경 실패:", error);

      alert(
        error.response?.data?.message || "기본 배송지 변경에 실패했습니다.",
      );
    }
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <p>배송 주소를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={backButtonStyle}
      >
        ← 이전 화면
      </button>

      <h2>배송 주소 관리</h2>

      {/* 등록 및 수정 폼 */}
      <section style={sectionStyle}>
        <h3>
          {editingAddressId !== null ? "배송 주소 수정" : "새 배송 주소 등록"}
        </h3>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            배송지 별칭
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="예: 집, 회사"
              style={inputStyle}
              maxLength={30}
              required
            />
          </label>

          <label style={labelStyle}>
            수령인 이름
            <input
              type="text"
              name="receiverName"
              value={formData.receiverName}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            연락처
            <input
              type="tel"
              name="receiverPhone"
              value={formData.receiverPhone}
              onChange={handleChange}
              placeholder="010-1234-5678"
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            기본 주소
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="도로명 또는 지번 주소"
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            상세 주소
            <input
              type="text"
              name="detailAddress"
              value={formData.detailAddress}
              onChange={handleChange}
              placeholder="동, 호수 등"
              style={inputStyle}
            />
          </label>

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              name="defaultAddress"
              checked={formData.defaultAddress}
              onChange={handleChange}
            />
            기본 배송지로 설정
          </label>

          <div style={buttonGroupStyle}>
            <button type="submit" disabled={saving} style={primaryButtonStyle}>
              {saving
                ? "저장 중..."
                : editingAddressId !== null
                  ? "수정 완료"
                  : "주소 등록"}
            </button>

            {editingAddressId !== null && (
              <button
                type="button"
                onClick={resetForm}
                style={secondaryButtonStyle}
              >
                수정 취소
              </button>
            )}
          </div>
        </form>
      </section>

      {/* 저장된 주소 목록 */}
      <section style={sectionStyle}>
        <h3>등록된 배송 주소 ({addresses.length})</h3>

        {addresses.length === 0 ? (
          <p>등록된 배송 주소가 없습니다.</p>
        ) : (
          addresses.map((address) => (
            <div key={address.id} style={addressCardStyle}>
              <div style={addressHeaderStyle}>
                <strong>{address.name || "배송지"}</strong>

                {address.defaultAddress && (
                  <span style={defaultBadgeStyle}>기본 배송지</span>
                )}
              </div>

              <p style={addressTextStyle}>
                {address.receiverName}
                {address.receiverPhone ? ` · ${address.receiverPhone}` : ""}
              </p>

              <p style={addressTextStyle}>{address.address}</p>

              {address.detailAddress && (
                <p style={addressTextStyle}>{address.detailAddress}</p>
              )}

              <div style={buttonGroupStyle}>
                <button
                  type="button"
                  onClick={() => handleEdit(address)}
                  style={secondaryButtonStyle}
                >
                  수정
                </button>

                {!address.defaultAddress && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    style={secondaryButtonStyle}
                  >
                    기본 배송지로 설정
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(address.id)}
                  style={deleteButtonStyle}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// 스타일
const pageStyle = {
  maxWidth: "650px",
  margin: "0 auto",
  padding: "20px",
};

const sectionStyle = {
  marginTop: "25px",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "10px",
};

const labelStyle = {
  display: "block",
  marginBottom: "15px",
  fontWeight: "bold",
};

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  marginTop: "7px",
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "5px",
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  margin: "15px 0",
};

const buttonGroupStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "15px",
};

const primaryButtonStyle = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "5px",
  backgroundColor: "#339af0",
  color: "#fff",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  padding: "8px 12px",
  border: "1px solid #ccc",
  borderRadius: "5px",
  background: "#fff",
  cursor: "pointer",
};

const deleteButtonStyle = {
  ...secondaryButtonStyle,
  color: "#e03131",
  borderColor: "#e03131",
};

const backButtonStyle = {
  padding: "8px 0",
  border: "none",
  background: "none",
  cursor: "pointer",
};

const addressCardStyle = {
  padding: "15px",
  marginTop: "12px",
  border: "1px solid #e5e5e5",
  borderRadius: "8px",
};

const addressHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
};

const defaultBadgeStyle = {
  padding: "4px 8px",
  borderRadius: "5px",
  backgroundColor: "#e7f5ff",
  color: "#1971c2",
  fontSize: "0.8rem",
};

const addressTextStyle = {
  margin: "8px 0",
  color: "#495057",
};

export default DeliveryAddressPage;
