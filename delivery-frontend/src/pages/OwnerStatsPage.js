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
} from "recharts";

function OwnerStatsPage() {
  const { storeId } = useParams();
  const { token, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // 1. 상태 관리: 초기값을 빈 배열로 명확히 설정
  const [stats, setStats] = useState({
    dailySales: [],
    topMenus: [],
  });

  // 2. 로딩 상태 추가 (데이터 오기 전에 빈 화면 방지)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 비로그인 시 튕겨내기
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        // 백엔드: OwnerStatsResponseDto 반환 (JSON: { dailySales: [], topMenus: [] })
        const response = await axios.get(
          `http://localhost:8080/api/owner/stats/${storeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setStats(response.data);
      } catch (error) {
        console.error("통계 데이터 로딩 실패", error);
        // 사장님이 아닌 경우 등 에러 처리
        if (error.response && error.response.status === 403) {
          alert("접근 권한이 없습니다. (본인 가게만 조회 가능)");
          navigate("/");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (storeId && token) {
      fetchStats();
    }
  }, [storeId, token, isLoggedIn, navigate]);

  // 3. 로딩 중일 때 보여줄 화면
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>📊 데이터를 분석 중입니다...</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1000px",
        margin: "0 auto",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1 style={{ margin: 0 }}>📊 매출 대시보드</h1>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "10px 15px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            backgroundColor: "white",
            cursor: "pointer",
          }}
        >
          뒤로 가기
        </button>
      </div>

      {/* --- 섹션 1: 일별 매출 그래프 --- */}
      <div
        style={{
          padding: "25px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          marginBottom: "30px",
        }}
      >
        <h3
          style={{
            borderLeft: "5px solid #8884d8",
            paddingLeft: "10px",
            marginBottom: "20px",
          }}
        >
          📅 최근 7일 매출 추이
        </h3>

        {stats.dailySales.length > 0 ? (
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer>
              <LineChart
                data={stats.dailySales}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => date.substring(5)} // '2023-12-25' -> '12-25'로 자르기
                />
                <YAxis
                  tickFormatter={(value) => `${value / 10000}만`} // 금액 축약 (선택사항)
                />
                <Tooltip
                  formatter={(value) => [
                    `${value.toLocaleString()}원`,
                    "매출액",
                  ]}
                  labelFormatter={(label) => `날짜: ${label}`}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalSales"
                  name="일 매출"
                  stroke="#8884d8"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "50px", color: "#999" }}>
            아직 매출 데이터가 충분하지 않습니다. 😅
          </div>
        )}
      </div>

      {/* --- 섹션 2: 인기 메뉴 TOP 5 --- */}
      <div
        style={{
          padding: "25px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <h3
          style={{
            borderLeft: "5px solid #82ca9d",
            paddingLeft: "10px",
            marginBottom: "20px",
          }}
        >
          🏆 우리 가게 인기 메뉴 (Top 5)
        </h3>

        {stats.topMenus.length > 0 ? (
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer>
              <BarChart
                data={stats.topMenus}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="menuName"
                  type="category"
                  width={120}
                  tick={{ fontSize: 13, fontWeight: "bold" }}
                />
                <Tooltip cursor={{ fill: "#f0f0f0" }} />
                <Legend />
                <Bar
                  dataKey="count"
                  name="판매량 (개)"
                  fill="#82ca9d"
                  barSize={25}
                  radius={[0, 4, 4, 0]}
                  label={{ position: "right", fill: "#666" }} // 막대 옆에 숫자 표시
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "50px", color: "#999" }}>
            아직 판매된 메뉴가 없습니다. 첫 주문을 기다려보세요! 🚀
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerStatsPage;
