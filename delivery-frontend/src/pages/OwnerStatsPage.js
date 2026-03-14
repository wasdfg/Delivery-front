import React, { useState, useEffect, useRef } from "react";
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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function OwnerStatsPage() {
  const { storeId } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef(); // PDF 캡처 영역 지정용

  // 1. 기간 선택 상태 (기본값: 최근 30일)
  const [dates, setDates] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const token = localStorage.getItem("token");
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  // 데이터 불러오기
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

  // ✅ PDF 다운로드 로직
  const downloadPdf = async () => {
    const element = reportRef.current;
    toast.info("리포트를 생성 중입니다...");

    const canvas = await html2canvas(element, {
      scale: 2, // 선명도 향상
      logging: false,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`매장분석리포트_${storeId}_${dates.startDate}.pdf`);
    toast.success("PDF 리포트가 다운로드되었습니다.");
  };

  if (loading || !stats)
    return (
      <div style={loadingStyle}>매장 데이터를 정밀 분석 중입니다... 📊</div>
    );

  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundColor: "#f8f9fa",
      }}
    >
      {/* 상단 컨트롤 바 (PDF 버튼 + 날짜 선택) */}
      <header style={headerStyle}>
        <div>
          <h2 style={{ fontSize: "1.8rem", color: "#333", margin: 0 }}>
            🏪 매장 경영 분석 리포트
          </h2>
          <p style={{ color: "#888", marginTop: "5px" }}>
            실시간 데이터를 바탕으로 한 성과 분석입니다.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={downloadPdf} style={downloadBtnStyle}>
            📄 PDF 다운로드
          </button>
          <div style={datePickerContainer}>
            <input
              type="date"
              value={dates.startDate}
              onChange={(e) =>
                setDates({ ...dates, startDate: e.target.value })
              }
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
        </div>
      </header>

      {/* ✅ 캡처 영역 시작 */}
      <div ref={reportRef} style={{ padding: "20px", borderRadius: "15px" }}>
        {/* 1. 핵심 요약 카드 */}
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
            value={`⭐ ${stats.averageRating?.toFixed(1)}`}
            color="#fd7e14"
            icon="✨"
          />
        </div>

        {/* 2. 정밀 인사이트 지표 */}
        <div style={insightGrid}>
          <InsightProgress
            title="단골 재방문율"
            value={stats.customerRetentionRate}
            color="#845ef7"
            description="재주문 고객 비중"
          />
          <InsightProgress
            title="주문 취소율"
            value={stats.cancellationRate}
            color="#fa5252"
            description="접수 후 취소 비율"
          />
          <InsightProgress
            title="리뷰 답글률"
            value={stats.replyRate}
            color="#15aabf"
            description="리뷰 대응 성실도"
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
    </div>
  );
}

// --- 하위 컴포넌트 ---

const InsightProgress = ({ title, value, color, description }) => {
  const percentage = Math.min(Math.max(value || 0, 0), 100);
  return (
    <div style={cardStyle}>
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
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: color,
            transition: "width 0.5s",
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
    <div style={{ color: "#888", fontSize: "0.85rem" }}>{title}</div>
    <div
      style={{
        fontSize: "1.3rem",
        fontWeight: "bold",
        color: "#333",
        marginTop: "5px",
      }}
    >
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

// --- Styles (생략 없이 통합) ---
const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "20px",
  marginBottom: "25px",
};
const insightGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  marginBottom: "25px",
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
  fontSize: "0.9rem",
  color: "#555",
};
const downloadBtnStyle = {
  padding: "10px 18px",
  backgroundColor: "#228be6",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "0.9rem",
};
const loadingStyle = {
  padding: "100px",
  textAlign: "center",
  fontSize: "1.1rem",
  color: "#666",
};

export default OwnerStatsPage;
