import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function StoreEditPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // 기본 요일 순서 정의 (데이터 정렬 및 초기화용)
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

  // 1. 기본 정보 상태
  const [storeInfo, setStoreInfo] = useState({
    name: "",
    phone: "",
    address: "",
    minOrderAmount: 0,
    deliveryFee: 0,
    description: "",
  });

  // 2. 영업 시간 상태 (7일치 초기값 설정)
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
        const data = res.data;

        // 기본 정보 세팅
        setStoreInfo({
          name: data.storeName,
          phone: data.storePhone,
          address: data.storeAddress,
          minOrderAmount: data.minOrderAmount,
          deliveryFee: data.deliveryFee,
          description: data.description,
        });

        // 영업 시간 세팅 (서버 데이터가 있으면 덮어쓰기)
        if (data.operationTimes && data.operationTimes.length > 0) {
          const mergedTimes = DAYS_ORDER.map((day) => {
            // 서버에서 온 데이터 중 해당 요일 찾기
            const existing = data.operationTimes.find(
              (ot) => ot.dayOfWeek === day
            );
            if (existing) {
              return {
                dayOfWeek: existing.dayOfWeek,
                openTime: existing.openTime.substring(0, 5), // "09:00:00" -> "09:00"
                closeTime: existing.closeTime.substring(0, 5),
                isDayOff: existing.isDayOff,
              };
            }
            // 데이터 없으면 기본값 유지
            return {
              dayOfWeek: day,
              openTime: "09:00",
              closeTime: "22:00",
              isDayOff: false,
            };
          });
          setOperationTimes(mergedTimes);
        }
      } catch (error) {
        alert("가게 정보를 불러오지 못했습니다.");
      }
    };
    fetchData();
  }, [storeId]);

  // 핸들러: 기본 정보 수정
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setStoreInfo((prev) => ({ ...prev, [name]: value }));
  };

  // 핸들러: 영업 시간 수정
  const handleTimeChange = (index, field, value) => {
    const newTimes = [...operationTimes];
    newTimes[index][field] = value;
    setOperationTimes(newTimes);
  };

  // 핸들러: 저장하기
  const handleSubmit = async (e) => {
    e.preventDefault();

    // DTO 구조에 맞춰 데이터 병합
    const requestData = {
      ...storeInfo,
      operationTimes: operationTimes,
    };

    // 이미지 파일 처리 로직이 있다면 FormData 사용 필요 (여기선 JSON 예시)
    try {
      await axios.put(
        // 또는 PATCH
        `http://localhost:8080/api/stores/${storeId}`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      alert("성공적으로 수정되었습니다!");
      navigate(`/store/${storeId}`);
    } catch (error) {
      console.error(error);
      alert("수정에 실패했습니다.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>🏪 가게 정보 수정</h2>
      <form onSubmit={handleSubmit}>
        {/* --- 기본 정보 섹션 --- */}
        <section style={sectionStyle}>
          <h3>기본 정보</h3>
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
          <div style={inputGroupStyle}>
            <label>주소</label>
            <input
              name="address"
              value={storeInfo.address}
              onChange={handleInfoChange}
              required
            />
          </div>
          <div style={inputGroupStyle}>
            <label>최소 주문 금액</label>
            <input
              type="number"
              name="minOrderAmount"
              value={storeInfo.minOrderAmount}
              onChange={handleInfoChange}
            />
          </div>
          <div style={inputGroupStyle}>
            <label>배달팁</label>
            <input
              type="number"
              name="deliveryFee"
              value={storeInfo.deliveryFee}
              onChange={handleInfoChange}
            />
          </div>
        </section>

        {/* --- 영업 시간 섹션 --- */}
        <section style={sectionStyle}>
          <h3>요일별 영업 시간 설정</h3>
          {operationTimes.map((ot, index) => (
            <div key={ot.dayOfWeek} style={timeRowStyle}>
              <div style={{ width: "40px", fontWeight: "bold" }}>
                {DAY_LABELS[ot.dayOfWeek]}
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginRight: "10px",
                  fontSize: "0.9rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={ot.isDayOff}
                  onChange={(e) =>
                    handleTimeChange(index, "isDayOff", e.target.checked)
                  }
                />
                <span style={{ marginLeft: "4px" }}>휴무</span>
              </label>

              <input
                type="time"
                value={ot.openTime}
                disabled={ot.isDayOff} // 휴무면 시간 입력 비활성화
                onChange={(e) =>
                  handleTimeChange(index, "openTime", e.target.value)
                }
              />
              <span style={{ margin: "0 5px" }}>~</span>
              <input
                type="time"
                value={ot.closeTime}
                disabled={ot.isDayOff}
                onChange={(e) =>
                  handleTimeChange(index, "closeTime", e.target.value)
                }
              />
            </div>
          ))}
        </section>

        <button type="submit" style={submitBtnStyle}>
          저장 완료
        </button>
      </form>
    </div>
  );
}

// 간단한 스타일 객체
const sectionStyle = {
  marginBottom: "30px",
  padding: "15px",
  border: "1px solid #ddd",
  borderRadius: "8px",
};
const inputGroupStyle = {
  marginBottom: "10px",
  display: "flex",
  flexDirection: "column",
};
const timeRowStyle = {
  display: "flex",
  alignItems: "center",
  marginBottom: "8px",
};
const submitBtnStyle = {
  width: "100%",
  padding: "15px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "1.1rem",
  cursor: "pointer",
};

export default StoreEditPage;
