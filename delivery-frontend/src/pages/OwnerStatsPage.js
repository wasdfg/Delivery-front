import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// 차트 컬러 테마 정의
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

function OwnerStatsPage() {
  const { storeId } = useParams();
  const { token, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ dailySales: [], topMenus: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `http://localhost:8080/api/owner/stats/${storeId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // 데이터 정렬 보장 (날짜순)
        const sortedSales = response.data.dailySales.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        setStats({ ...response.data, dailySales: sortedSales });
      } catch (error) {
        if (error.response?.status === 403) {
          alert("접근 권한이 없습니다.");
          navigate("/");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (storeId && token) fetchStats();
  }, [storeId, token, isLoggedIn, navigate]);

  if (isLoading)
    return (
      <div className="loading-container">
        📊 통계 데이터를 불러오는 중입니다...
      </div>
    );

  return (
    <div className="stats-dashboard" style={containerStyle}>
      <header style={headerStyle}>
        <h2>📈 매출 분석 대시보드</h2>
        <button onClick={() => navigate(-1)} className="back-btn">
          뒤로가기
        </button>
      </header>

      {/* --- 섹션 1: 일별 매출 (라인 차트) --- */}
      <section style={cardStyle}>
        <h4 style={titleStyle}>📅 최근 7일 매출 추이</h4>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={stats.dailySales}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#eee"
              />
              <XAxis
                dataKey="date"
                tickFormatter={(val) => val.split("-").slice(1).join("/")}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(val) => [`${val.toLocaleString()}원`, "매출액"]}
                contentStyle={{
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalSales"
                name="일별 매출"
                stroke="#8884d8"
                strokeWidth={3}
                dot={{ r: 4, fill: "#8884d8" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* --- 섹션 2: 인기 메뉴 (바 차트) --- */}
      <section style={{ ...cardStyle, marginTop: "20px" }}>
        <h4 style={titleStyle}>🏆 인기 메뉴 TOP 5</h4>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={stats.topMenus} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#eee"
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="menuName"
                type="category"
                width={100}
                tick={{ fontSize: 12, fontWeight: "500" }}
              />
              <Tooltip cursor={{ fill: "#f8f9fa" }} />
              <Bar dataKey="count" name="판매 수량" radius={[0, 5, 5, 0]}>
                {stats.topMenus.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

// Inline Styles
const containerStyle = {
  padding: "20px",
  maxWidth: "900px",
  margin: "0 auto",
  backgroundColor: "#f4f7f6",
  minHeight: "100vh",
};
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};
const cardStyle = {
  padding: "20px",
  backgroundColor: "#fff",
  borderRadius: "15px",
  boxShadow: "0 2px 15px rgba(0,0,0,0.03)",
};
const titleStyle = {
  margin: "0 0 20px 0",
  fontSize: "1.1rem",
  color: "#333",
  borderLeft: "4px solid #8884d8",
  paddingLeft: "12px",
};

export default OwnerStatsPage;
