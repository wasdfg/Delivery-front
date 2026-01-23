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
} from "recharts";
import { toast } from "react-toastify";

function OwnerStatsPage() {
  const { storeId } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // 파이 차트 색상 테마
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
        setStats(res.data);
      } catch (error) {
        toast.error("통계 데이터를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [storeId, token]);

  if (loading)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        통계 분석 중... 📊
      </div>
    );
  if (!stats)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        데이터가 없습니다.
      </div>
    );

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h2 style={{ marginBottom: "30px" }}>📈 매장 운영 분석 보고서</h2>

      {/* 상단 요약 카드 */}
      <div style={summaryGridStyle}>
        <div style={cardStyle}>
          <h4>총 매출</h4>
          <p style={priceStyle}>{stats.totalSales?.toLocaleString()}원</p>
        </div>
        <div style={cardStyle}>
          <h4>총 주문 건수</h4>
          <p style={countStyle}>{stats.totalOrderCount}건</p>
        </div>
        <div style={cardStyle}>
          <h4>평균 객단가</h4>
          <p style={avgStyle}>
            {stats.totalOrderCount > 0
              ? Math.floor(
                  stats.totalSales / stats.totalOrderCount
                ).toLocaleString()
              : 0}
            원
          </p>
        </div>
      </div>

      <div style={chartGridStyle}>
        {/* 1. 일별 매출 추이 (선 그래프) */}
        <div style={chartCardStyle}>
          <h3 style={{ marginBottom: "20px" }}>📅 일별 매출 추이 (최근 7일)</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={stats.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `${value / 10000}만`} />
                <Tooltip
                  formatter={(value) => [`${value.toLocaleString()}원`, "매출"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalSales"
                  stroke="#8884d8"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                  name="매출액"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. 인기 메뉴 비중 (파이 차트) */}
        <div style={chartCardStyle}>
          <h3 style={{ marginBottom: "20px" }}>🍕 메뉴 판매 비중 (TOP 5)</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={stats.topMenus}
                  dataKey="count"
                  nameKey="menuName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.menuName}
                >
                  {stats.topMenus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 스타일링 ---
const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  marginBottom: "30px",
};
const chartGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
};
const cardStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  textAlign: "center",
};
const chartCardStyle = {
  backgroundColor: "#fff",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
};
const priceStyle = {
  fontSize: "1.8rem",
  fontWeight: "bold",
  color: "#2b8a3e",
  margin: "10px 0 0 0",
};
const countStyle = {
  fontSize: "1.8rem",
  fontWeight: "bold",
  color: "#1971c2",
  margin: "10px 0 0 0",
};
const avgStyle = {
  fontSize: "1.8rem",
  fontWeight: "bold",
  color: "#e67e22",
  margin: "10px 0 0 0",
};

export default OwnerStatsPage;
