import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

function AdminStatsPage() {
  const { token } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:8080/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStats(res.data);
    } catch (err) {
      console.error(err);

      toast.error(err.response?.data?.message ?? "통계 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div style={containerStyle}>
        <h3>통계 조회 중...</h3>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={containerStyle}>
        <h3>통계 정보를 불러올 수 없습니다.</h3>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1>관리자 통계</h1>

      {/* 전체 현황 */}
      <section style={sectionStyle}>
        <h2>전체 현황</h2>

        <div style={cardGridFour}>
          <StatCard
            title="일반 회원"
            value={`${formatNumber(stats.totalUsers)}명`}
          />

          <StatCard
            title="가게"
            value={`${formatNumber(stats.totalStores)}개`}
          />

          <StatCard
            title="라이더"
            value={`${formatNumber(stats.totalRiders)}명`}
          />

          <StatCard
            title="탈퇴 회원"
            value={`${formatNumber(stats.withdrawnUsers)}명`}
          />
        </div>
      </section>

      {/* 오늘의 현황 */}
      <section style={sectionStyle}>
        <h2>오늘의 현황</h2>

        <div style={cardGridThree}>
          <StatCard
            title="오늘 주문"
            value={`${formatNumber(stats.todayOrders)}건`}
          />

          <StatCard
            title="오늘 매출"
            value={`${formatNumber(stats.todaySales)}원`}
          />

          <StatCard
            title="오늘 평균 주문금액"
            value={`${formatNumber(stats.todayAverageOrderPrice)}원`}
          />
        </div>
      </section>

      <div style={refreshArea}>
        <button onClick={fetchStats}>새로고침</button>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{title}</div>

      <div style={valueStyle}>{value}</div>
    </div>
  );
}

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "0";
  }

  return Number(value).toLocaleString();
}

const containerStyle = {
  maxWidth: "1200px",
  margin: "30px auto",
  padding: "0 20px",
};

const sectionStyle = {
  marginBottom: "40px",
};

const cardGridFour = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "20px",
};

const cardGridThree = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "25px",
  backgroundColor: "#fff",
  textAlign: "center",
};

const titleStyle = {
  fontSize: "16px",
  color: "#666",
  marginBottom: "15px",
};

const valueStyle = {
  fontSize: "28px",
  fontWeight: "bold",
};

const refreshArea = {
  textAlign: "right",
};

export default AdminStatsPage;
