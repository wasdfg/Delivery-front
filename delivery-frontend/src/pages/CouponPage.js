import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function CouponPage() {
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [myCoupons, setMyCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState("");

  // 페이지 접속 시 '발급 가능 쿠폰'과 '내 쿠폰'을 동시에 불러옵니다.
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 💡 실제로는 로그인 시 저장된 토큰을 헤더에 담아야 합니다. (axios interceptor 활용 추천)
      const [availableRes, myRes] = await Promise.all([
        axios.get("/api/coupons"),
        axios.get("/api/coupons/my"),
      ]);
      setAvailableCoupons(availableRes.data);
      setMyCoupons(myRes.data);
    } catch (error) {
      console.error("쿠폰 데이터를 불러오지 못했습니다.", error);
    }
  };

  // 일반 쿠폰 발급 (버튼 클릭)
  const handleIssueCoupon = async (couponId) => {
    try {
      await axios.post(`/api/coupons/${couponId}/issue`);
      toast.success("쿠폰이 발급되었습니다!");
      fetchData(); // 발급 성공 시 목록 새로고침 (수량 및 내 쿠폰함 갱신)
    } catch (error) {
      toast.error(error.response?.data?.message || "발급에 실패했습니다.");
    }
  };

  // 코드로 쿠폰 발급
  const handleIssueByCode = async () => {
    if (!couponCode.trim()) return toast.warning("쿠폰 코드를 입력해주세요.");

    try {
      await axios.post("/api/coupons/issue-by-code", { code: couponCode });
      toast.success("코드 쿠폰이 등록되었습니다!");
      setCouponCode(""); // 입력창 초기화
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "유효하지 않은 코드입니다.");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      {/* 🎫 1. 코드 입력 섹션 */}
      <section style={sectionStyle}>
        <h3>프로모션 코드 입력</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="쿠폰 코드를 입력하세요"
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <button onClick={handleIssueByCode} style={actionBtnStyle}>
            등록
          </button>
        </div>
      </section>

      {/* 🎫 2. 선착순 쿠폰 발급 섹션 */}
      <section style={sectionStyle}>
        <h3>이벤트 쿠폰 받기</h3>
        {availableCoupons.map((coupon) => {
          const isSoldOut = coupon.issuedQuantity >= coupon.totalQuantity;
          const isAlreadyOwned = myCoupons.some((c) => c.id === coupon.id);

          return (
            <div key={coupon.id} style={cardStyle}>
              <div>
                <strong>{coupon.name}</strong>
                <p style={{ margin: "5px 0", color: "#666" }}>
                  {coupon.discountAmount}원 할인
                </p>
                <small>
                  남은 수량: {coupon.totalQuantity - coupon.issuedQuantity}개
                </small>
              </div>
              <button
                onClick={() => handleIssueCoupon(coupon.id)}
                disabled={isSoldOut || isAlreadyOwned}
                style={buttonStyle(isSoldOut, isAlreadyOwned)}
              >
                {isAlreadyOwned ? "보유중" : isSoldOut ? "마감" : "받기"}
              </button>
            </div>
          );
        })}
      </section>

      {/* 🎫 3. 내 쿠폰함 섹션 */}
      <section style={sectionStyle}>
        <h3>내 쿠폰함</h3>
        {myCoupons.length === 0 ? (
          <p style={{ color: "#888" }}>보유한 쿠폰이 없습니다.</p>
        ) : (
          myCoupons.map((coupon) => (
            <div
              key={coupon.id}
              style={{ ...cardStyle, borderColor: "#28a745" }}
            >
              <strong>{coupon.name}</strong>
              <span style={{ color: "#28a745", fontWeight: "bold" }}>
                {coupon.discountAmount}원 할인
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// 간단한 인라인 스타일
const sectionStyle = {
  marginBottom: "30px",
  padding: "20px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
};
const cardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "15px",
  backgroundColor: "#fff",
  border: "1px solid #ddd",
  borderRadius: "6px",
  marginBottom: "10px",
};
const actionBtnStyle = {
  padding: "10px 20px",
  backgroundColor: "#333",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
const buttonStyle = (isSoldOut, isAlreadyOwned) => ({
  padding: "8px 16px",
  border: "none",
  borderRadius: "4px",
  fontWeight: "bold",
  backgroundColor: isAlreadyOwned ? "#17a2b8" : isSoldOut ? "#ccc" : "#ff4757",
  color: "#fff",
  cursor: isSoldOut || isAlreadyOwned ? "not-allowed" : "pointer",
});

export default CouponPage;
