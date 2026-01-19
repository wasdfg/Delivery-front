import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function StoreEditPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const DAYS_ORDER = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];
  const DAY_LABELS = {
    MONDAY: "월",
    TUESDAY: "화",
    WEDNESDAY: "수",
    THURSDAY: "목",
    FRIDAY: "금",
    SATURDAY: "토",
    SUNDAY: "일",
  };

  const [storeInfo, setStoreInfo] = useState({
    name: "",
    phone: "",
    address: "",
    minOrderAmount: 0,
    deliveryFee: 0,
    description: "",
  });

  const [operationTimes, setOperationTimes] = useState(
    DAYS_ORDER.map((day) => ({
      dayOfWeek: day,
      openTime: "09:00",
      closeTime: "22:00",
      isDayOff: false,
    }))
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/stores/${storeId}`
        );
        const {
          storeName,
          storePhone,
          storeAddress,
          minOrderAmount,
          deliveryFee,
          description,
          operationTimes: serverTimes,
        } = res.data;

        setStoreInfo({
          name: storeName,
          phone: storePhone,
          address: storeAddress,
          minOrderAmount,
          deliveryFee,
          description,
        });

        if (serverTimes && serverTimes.length > 0) {
          const mergedTimes = DAYS_ORDER.map((day) => {
            const existing = serverTimes.find((ot) => ot.dayOfWeek === day);
            return existing
              ? {
                  ...existing,
                  openTime: existing.openTime.substring(0, 5),
                  closeTime: existing.closeTime.substring(0, 5),
                }
              : {
                  dayOfWeek: day,
                  openTime: "09:00",
                  closeTime: "22:00",
                  isDayOff: false,
                };
          });
          setOperationTimes(mergedTimes);
        }
      } catch (error) {
        toast.error("정보를 불러오지 못했습니다.");
      }
    };
    fetchData();
  }, [storeId]);

  // 💡 편의 기능: 월요일 시간을 나머지 요일에 일괄 적용
  const applyAllDays = () => {
    const monday = operationTimes[0];
    const newTimes = operationTimes.map((ot) => ({
      ...ot,
      openTime: monday.openTime,
      closeTime: monday.closeTime,
      isDayOff: monday.isDayOff,
    }));
    setOperationTimes(newTimes);
    toast.info("월요일 설정이 모든 요일에 적용되었습니다.");
  };

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setStoreInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (index, field, value) => {
    const newTimes = [...operationTimes];
    newTimes[index][field] = value;
    setOperationTimes(newTimes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:8080/api/stores/${storeId}`,
        {
          ...storeInfo,
          operationTimes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("가게 정보가 성공적으로 수정되었습니다.");
      navigate(`/store/${storeId}`);
    } catch (error) {
      toast.error("수정에 실패했습니다.");
    }
  };

  return (
    <div
      className="store-edit-container"
      style={{ padding: "40px 20px", maxWidth: "700px", margin: "0 auto" }}
    >
      <h2 style={{ marginBottom: "30px", textAlign: "center" }}>
        🏪 가게 정보 수정
      </h2>

      <form onSubmit={handleSubmit}>
        <section style={cardStyle}>
          <h3 style={sectionTitleStyle}>📌 기본 정보</h3>
          <div style={gridInputStyle}>
            <div style={inputGroupStyle}>
              <label>가게 이름</label>
              <input
                name="name"
                value={storeInfo.name}
                onChange={handleInfoChange}
                required
              />
            </div>
            <div style={inputGroupStyle}>
              <label>전화번호</label>
              <input
                name="phone"
                value={storeInfo.phone}
                onChange={handleInfoChange}
                required
              />
            </div>
          </div>
          <div style={inputGroupStyle}>
            <label>가게 주소</label>
            <input
              name="address"
              value={storeInfo.address}
              onChange={handleInfoChange}
              required
            />
          </div>
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h3 style={{ margin: 0 }}>🕒 영업 시간 설정</h3>
            <button type="button" onClick={applyAllDays} style={smallBtnStyle}>
              월요일 설정 일괄 적용
            </button>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {operationTimes.map((ot, index) => (
              <div key={ot.dayOfWeek} style={timeRowStyle}>
                <div
                  style={{
                    width: "50px",
                    fontWeight: "bold",
                    color:
                      ot.dayOfWeek === "SUNDAY"
                        ? "red"
                        : ot.dayOfWeek === "SATURDAY"
                        ? "blue"
                        : "inherit",
                  }}
                >
                  {DAY_LABELS[ot.dayOfWeek]}요일
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    width: "70px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={ot.isDayOff}
                    onChange={(e) =>
                      handleTimeChange(index, "isDayOff", e.target.checked)
                    }
                  />
                  <span style={{ marginLeft: "5px" }}>휴무</span>
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    opacity: ot.isDayOff ? 0.3 : 1,
                  }}
                >
                  <input
                    type="time"
                    value={ot.openTime}
                    disabled={ot.isDayOff}
                    onChange={(e) =>
                      handleTimeChange(index, "openTime", e.target.value)
                    }
                  />
                  <span>~</span>
                  <input
                    type="time"
                    value={ot.closeTime}
                    disabled={ot.isDayOff}
                    onChange={(e) =>
                      handleTimeChange(index, "closeTime", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: "flex", gap: "15px" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ ...submitBtnStyle, backgroundColor: "#adb5bd", flex: 1 }}
          >
            취소
          </button>
          <button type="submit" style={{ ...submitBtnStyle, flex: 2 }}>
            저장하기
          </button>
        </div>
      </form>
    </div>
  );
}

// 스타일 가이드
const cardStyle = {
  backgroundColor: "#fff",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  marginBottom: "25px",
  border: "1px solid #eee",
};
const sectionTitleStyle = {
  borderBottom: "2px solid #007bff",
  paddingBottom: "10px",
  marginBottom: "20px",
  fontSize: "1.1rem",
};
const gridInputStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "15px",
};
const inputGroupStyle = {
  marginBottom: "15px",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
};
const timeRowStyle = {
  display: "flex",
  alignItems: "center",
  padding: "10px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
};
const smallBtnStyle = {
  padding: "5px 10px",
  fontSize: "0.8rem",
  cursor: "pointer",
  backgroundColor: "#e7f5ff",
  border: "1px solid #339af0",
  color: "#1971c2",
  borderRadius: "4px",
};
const submitBtnStyle = {
  padding: "15px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "1.1rem",
  cursor: "pointer",
  fontWeight: "bold",
};

export default StoreEditPage;
