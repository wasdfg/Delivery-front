import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

function AdminPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:8080/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDashboard(res.data);
    } catch (err) {
      toast.error("대시보드 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <div style={{ padding: "30px" }}>불러오는 중...</div>;
  }

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "30px auto",
      }}
    >
      <h1>관리자 대시보드</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        <DashboardCard title="회원 수" value={`${dashboard.totalUsers}명`} />

        <DashboardCard title="가게 수" value={`${dashboard.totalStores}개`} />

        <DashboardCard title="라이더 수" value={`${dashboard.totalRiders}명`} />

        <DashboardCard
          title="탈퇴 회원"
          value={`${dashboard.withdrawnUsers}명`}
        />

        <DashboardCard title="오늘 주문" value={`${dashboard.todayOrders}건`} />

        <DashboardCard
          title="오늘 매출"
          value={`${dashboard.todaySales.toLocaleString()}원`}
        />

        <DashboardCard
          title="평균 주문금액"
          value={`${Math.round(
            dashboard.todayAverageOrderPrice,
          ).toLocaleString()}원`}
        />
      </div>

      <hr
        style={{
          margin: "50px 0",
        }}
      />

      <h2>관리 메뉴</h2>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px",
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => navigate("/admin/users")}>회원 관리</button>

        <button onClick={() => navigate("/admin/stores")}>가게 관리</button>

        <button onClick={() => navigate("/admin/logs")}>관리자 로그</button>
      </div>

      <div
        style={{
          marginTop: "50px",
        }}
      >
        <h2>최근 관리자 작업</h2>

        <div
          style={{
            border: "1px solid #ddd",
            padding: "20px",
            borderRadius: "8px",
            background: "#fafafa",
          }}
        >
          <p>AdminLog 조회 API를 만들어야함</p>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "10px",
        padding: "20px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
        backgroundColor: "#fff",
      }}
    >
      <div
        style={{
          fontSize: "15px",
          color: "#666",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "10px",
          fontSize: "28px",
          fontWeight: "bold",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default AdminPage;
