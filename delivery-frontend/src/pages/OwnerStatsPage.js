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
  const token = localStorage.getItem("token");

  // 요일 매핑용 (백엔드 1~7 숫자를 한글로 변환)
  const DAY_MAP = {
    1: "일",
    2: "월",
    3: "화",
    4: "수",
    5: "목",
    6: "금",
    7: "토",
  };
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/owner/stats/${storeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // 데이터 전처리: 요일 숫자를 한글로 변환
        const formattedStats = {
          ...res.data,
          dayOfWeekStats: res.data.dayOfWeekStats.map((d) => ({
            ...d,
            day: DAY_MAP[d.day] || d.day,
          })),
        };
        setStats(formattedStats);
      } catch (error) {
        toast.error("통계 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [storeId, token]);

  if (loading)
    return <div style={loadingStyle}>매장 데이터를 분석 중입니다... 📊</div>;

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <header
        style={{
          marginBottom: "40px",
          borderBottom: "2px solid #eee",
          paddingBottom: "20px",
        }}
      >
        <h2 style={{ fontSize: "2rem", color: "#333" }}>
          🏪 매장 운영 정밀 리포트
        </h2>
        <p style={{ color: "#666" }}>
          가게의 매출 추이와 주문 패턴을 분석한 결과입니다.
        </p>
      </header>

      {/* 1. 요약 카드 섹션 */}
      <div style={summaryGrid}>
        <StatCard
          title="누적 매출액"
          value={`${stats.totalSales?.toLocaleString()}원`}
          color="#2b8a3e"
        />
        <StatCard
          title="누적 주문수"
          value={`${stats.totalOrderCount}건`}
          color="#1971c2"
        />
        <StatCard
          title="평균 객단가"
          value={`${Math.floor(
            stats.totalSales / stats.totalOrderCount || 0
          ).toLocaleString()}원`}
          color="#e67e22"
        />
      </div>

      {/* 2. 메인 차트 그리드 (2x2) */}
      <div style={chartGrid}>
        {/* 일별 매출 추이 */}
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
              strokeWidth={4}
              dot={{ r: 6 }}
              activeDot={{ r: 10 }}
            />
          </LineChart>
        </ChartContainer>

        {/* 인기 메뉴 비중 */}
        <ChartContainer title="🍕 메뉴 판매 비중 (TOP 5)">
          <PieChart>
            <Pie
              data={stats.topMenus}
              dataKey="count"
              nameKey="menuName"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
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

        {/* 시간대별 주문 분포 */}
        <ChartContainer title="⏰ 시간대별 주문 집중도">
          <BarChart data={stats.hourlyStats}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hour" unit="시" />
            <YAxis />
            <Tooltip cursor={{ fill: "#f1f3f5" }} />
            <Bar
              dataKey="orderCount"
              fill="#fab005"
              radius={[4, 4, 0, 0]}
              name="주문수"
            />
          </BarChart>
        </ChartContainer>

        {/* 요일별 매출 분석 */}
        <ChartContainer title="🗓️ 요일별 매출 비중">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="80%"
            data={stats.dayOfWeekStats}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="day" />
            <Radar
              name="매출"
              dataKey="sales"
              stroke="#e64980"
              fill="#e64980"
              fillOpacity={0.5}
            />
            <Tooltip formatter={(val) => `${val.toLocaleString()}원`} />
          </RadarChart>
        </ChartContainer>
      </div>
    </div>
  );
}

// --- 하위 컴포넌트 및 스타일 ---

const StatCard = ({ title, value, color }) => (
  <div
    style={{
      ...cardStyle,
      textAlign: "center",
      borderTop: `5px solid ${color}`,
    }}
  >
    <h4 style={{ color: "#888", marginBottom: "10px" }}>{title}</h4>
    <p style={{ fontSize: "1.8rem", fontWeight: "bold", color }}>{value}</p>
  </div>
);

const ChartContainer = ({ title, children }) => (
  <div style={cardStyle}>
    <h3 style={{ marginBottom: "20px", fontSize: "1.1rem" }}>{title}</h3>
    <div style={{ width: "100%", height: "300px" }}>
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  </div>
);

const chartGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
  gap: "25px",
};
const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  marginBottom: "40px",
};
const cardStyle = {
  backgroundColor: "#fff",
  padding: "25px",
  borderRadius: "15px",
  boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
};
const loadingStyle = {
  padding: "100px",
  textAlign: "center",
  fontSize: "1.2rem",
  color: "#666",
};

export default OwnerStatsPage;
