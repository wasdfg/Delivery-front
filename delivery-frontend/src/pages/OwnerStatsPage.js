import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { toast } from "react-toastify";

function OwnerStatsPage() {
  const { storeId } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ 1. 기간 선택 상태 (기본값: 최근 30일)
  const [dates, setDates] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const token = localStorage.getItem("token");
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const fetchStats = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/owner/stats/${storeId}`,
        {
          params: { startDate: dates.startDate, endDate: dates.endDate },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(res.data);
    } catch (error) {
      toast.error("통계 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [storeId, dates]);

  if (loading || !stats)
    return <div style={loadingStyle}>매장 데이터를 분석 중입니다... 📊</div>;

  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundColor: "#f8f9fa",
      }}
    >
      <header style={headerStyle}>
        <div>
          <h2 style={{ fontSize: "1.8rem", color: "#333", margin: 0 }}>
            🏪 매장 경영 분석 리포트
          </h2>
          <p style={{ color: "#888", marginTop: "5px" }}>
            데이터 기반으로 매장 운영 상태를 진단합니다.
          </p>
        </div>
        <div style={datePickerContainer}>
          <input
            type="date"
            value={dates.startDate}
            onChange={(e) => setDates({ ...dates, startDate: e.target.value })}
            style={dateInputStyle}
          />
          <span style={{ margin: "0 10px" }}>~</span>
          <input
            type="date"
            value={dates.endDate}
            onChange={(e) => setDates({ ...dates, endDate: e.target.value })}
            style={dateInputStyle}
          />
        </div>
      </header>

      {/* 1. 핵심 요약 카드 (상단 4칸) */}
      <div style={summaryGrid}>
        <StatCard
          title="총 매출액"
          value={`${stats.totalSales?.toLocaleString()}원`}
          color="#228be6"
          icon="💰"
        />
        <StatCard
          title="총 주문수"
          value={`${stats.totalOrderCount}건`}
          color="#40c057"
          icon="📦"
        />
        <StatCard
          title="평균 객단가"
          value={`${stats.averageOrderValue?.toLocaleString()}원`}
          color="#fab005"
          icon="👤"
        />
        <StatCard
          title="평균 별점"
          value={`⭐ ${stats.averageRating?.toFixed(1)} / 5.0`}
          color="#fd7e14"
          icon="✨"
        />
      </div>

      {/* 2. 정밀 분석 지표 (신규 추가된 4개 지표) */}
      <div style={insightGrid}>
        <InsightProgress
          title="단골 재방문율"
          value={stats.customerRetentionRate}
          color="#845ef7"
          description="한 번 이상 재주문한 고객 비율"
        />
        <InsightProgress
          title="주문 취소율"
          value={stats.cancellationRate}
          color="#fa5252"
          description="접수 후 취소된 주문 비율 (낮을수록 좋음)"
          inverse
        />
        <InsightProgress
          title="리뷰 답글률"
          value={stats.replyRate}
          color="#15aabf"
          description="고객 리뷰에 답글을 단 비율"
        />
      </div>

      {/* 3. 차트 섹션 */}
      <div style={chartGrid}>
        <ChartContainer title="📅 일별 매출 추이">
          <LineChart data={stats.dailySales}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(val) => `${val / 10000}만`} />
            <Tooltip
              formatter={(val) => [`${val.toLocaleString()}원`, "매출"]}
            />
            <Line
              type="monotone"
              dataKey="totalSales"
              stroke="#339af0"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>

        <ChartContainer title="🍕 인기 메뉴 TOP 5">
          <PieChart>
            <Pie
              data={stats.topMenus}
              dataKey="count"
              nameKey="menuName"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
            >
              {stats.topMenus.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  );
}

// --- 신규 지표 전용 컴포넌트 (InsightProgress) ---
const InsightProgress = ({
  title,
  value,
  color,
  description,
  inverse = false,
}) => {
  const percentage = Math.min(Math.max(value || 0, 0), 100);
  return (
    <div style={insightCardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontWeight: "bold", color: "#444" }}>{title}</span>
        <span style={{ fontWeight: "bold", color }}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: "8px",
          backgroundColor: "#eee",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: color,
            transition: "width 0.5s ease-in-out",
          }}
        />
      </div>
      <p style={{ fontSize: "0.8rem", color: "#999", marginTop: "8px" }}>
        {description}
      </p>
    </div>
  );
};

const StatCard = ({ title, value, color, icon }) => (
  <div
    style={{
      ...cardStyle,
      borderTop: `4px solid ${color}`,
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: "1.5rem", marginBottom: "5px" }}>{icon}</div>
    <div style={{ color: "#888", fontSize: "0.9rem", marginBottom: "5px" }}>
      {title}
    </div>
    <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#333" }}>
      {value}
    </div>
  </div>
);

const ChartContainer = ({ title, children }) => (
  <div style={cardStyle}>
    <h3 style={{ marginBottom: "20px", fontSize: "1rem", color: "#444" }}>
      {title}
    </h3>
    <div style={{ width: "100%", height: "300px" }}>
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  </div>
);

// --- Styles ---
const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "20px",
  marginBottom: "30px",
};
const insightGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  marginBottom: "30px",
};
const chartGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
};
const cardStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.03)",
};
const insightCardStyle = {
  ...cardStyle,
  display: "flex",
  flexDirection: "column",
};
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "30px",
};
const datePickerContainer = {
  display: "flex",
  alignItems: "center",
  backgroundColor: "#fff",
  padding: "8px 15px",
  borderRadius: "10px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
};
const dateInputStyle = {
  border: "none",
  outline: "none",
  color: "#555",
  fontSize: "0.9rem",
  cursor: "pointer",
};
const loadingStyle = { padding: "100px", textAlign: "center", color: "#666" };

export default OwnerStatsPage;
