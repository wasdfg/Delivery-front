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
} from "recharts";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function OwnerStatsPage() {
  const { storeId } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const reportRef = useRef();

  const token = localStorage.getItem("token");

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  // 기본 최근 7일
  const [dates, setDates] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // 빠른 기간 선택
  const setQuickRange = (days) => {
    const end = new Date();
    const start = new Date();

    if (days !== 0) {
      start.setDate(end.getDate() - days);
    }

    setDates({
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
  };

  // 통계 조회
  const fetchStats = async () => {
    if (dates.startDate > dates.endDate) {
      toast.error("시작일은 종료일보다 이후일 수 없습니다.");

      return;
    }

    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:8080/api/owner/stats/${storeId}`,
        {
          params: {
            startDate: dates.startDate,
            endDate: dates.endDate,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStats(res.data);
    } catch (error) {
      console.error(error);
      toast.error("통계 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const { user } = useAuth();
  // 최초 진입 시만 조회
  useEffect(() => {
    if (user?.role !== "STORE_OWNER") {
      navigate("/");

      toast.error("사장님만 접근 가능합니다.");
    }
  }, []);

  // PDF 다운로드
  const downloadPdf = async () => {
    const element = reportRef.current;

    toast.info("PDF 리포트를 생성 중입니다...");

    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    pdf.save(`매장통계_${storeId}_${dates.startDate}_${dates.endDate}.pdf`);

    toast.success("PDF 다운로드가 완료되었습니다.");
  };

  if (loading) {
    return <div style={loadingStyle}>매장 데이터를 분석 중입니다... 📊</div>;
  }

  if (!stats) {
    return <div style={loadingStyle}>통계 데이터를 불러오지 못했습니다.</div>;
  }

  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundColor: "#f8f9fa",
      }}
    >
      {/* 상단 */}
      <header style={headerStyle}>
        <div>
          <h2
            style={{
              fontSize: "1.8rem",
              color: "#333",
              margin: 0,
            }}
          >
            🏪 매장 경영 분석 리포트
          </h2>

          <p
            style={{
              color: "#888",
              marginTop: "5px",
            }}
          >
            기간별 매장 운영 데이터를 분석합니다.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "flex-end",
          }}
        >
          {/* 빠른 기간 선택 */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={quickBtnStyle} onClick={() => setQuickRange(0)}>
              오늘
            </button>

            <button style={quickBtnStyle} onClick={() => setQuickRange(7)}>
              최근 7일
            </button>

            <button style={quickBtnStyle} onClick={() => setQuickRange(30)}>
              최근 30일
            </button>

            <button style={quickBtnStyle} onClick={() => setQuickRange(90)}>
              최근 90일
            </button>
          </div>

          {/* 날짜 선택 */}
          <div style={datePickerContainer}>
            <input
              type="date"
              value={dates.startDate}
              onChange={(e) =>
                setDates({
                  ...dates,
                  startDate: e.target.value,
                })
              }
              style={dateInputStyle}
            />

            <span style={{ margin: "0 10px" }}>~</span>

            <input
              type="date"
              value={dates.endDate}
              onChange={(e) =>
                setDates({
                  ...dates,
                  endDate: e.target.value,
                })
              }
              style={dateInputStyle}
            />

            <button onClick={fetchStats} style={searchBtnStyle}>
              조회
            </button>

            <button onClick={downloadPdf} style={downloadBtnStyle}>
              📄 PDF 다운로드
            </button>
          </div>
        </div>
      </header>

      {/* 캡처 영역 */}
      <div
        ref={reportRef}
        style={{
          padding: "20px",
          borderRadius: "15px",
        }}
      >
        {/* 요약 카드 */}
        <div style={summaryGrid}>
          <StatCard
            title="총 매출액"
            value={`${stats.totalSales?.toLocaleString()}원`}
            color="#228be6"
            icon="💰"
          />

          <StatCard
            title="총 주문 수"
            value={`${stats.completedOrderCount}건`}
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

        {/* 인사이트 */}
        <div style={insightGrid}>
          <InsightProgress
            title="단골 재방문율"
            value={stats.customerRetentionRate}
            color="#845ef7"
            description="재주문 고객 비율"
          />

          <InsightProgress
            title="주문 취소율"
            value={stats.cancellationRate}
            color="#fa5252"
            description="주문 취소 비율"
          />

          <InsightProgress
            title="리뷰 답글률"
            value={stats.replyRate}
            color="#15aabf"
            description="리뷰 응답률"
          />
        </div>

        {/* 차트 */}
        <div style={chartGrid}>
          <ChartContainer title="📅 일별 매출 추이">
            <LineChart data={stats.dailySales}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis dataKey="date" />

              <YAxis tickFormatter={(val) => `${val / 10000}만`} />

              <Tooltip
                formatter={(val) => [`${val.toLocaleString()}원`, "매출"]}
              />

              <Legend />

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
                dataKey="orderCount"
                nameKey="menuName"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ menuName, percent }) =>
                  `${menuName} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {stats.topMenus.map((_, index) => (
                  <Cell key={index} />
                ))}
              </Pie>

              <Tooltip formatter={(value) => [`${value}회 주문`, "주문수"]} />

              <Legend verticalAlign="bottom" height={50} />
            </PieChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}

// 인사이트 카드
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
        <span
          style={{
            fontWeight: "bold",
            color: "#444",
          }}
        >
          {title}
        </span>

        <span
          style={{
            fontWeight: "bold",
            color,
          }}
        >
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

      <p
        style={{
          fontSize: "0.8rem",
          color: "#999",
          marginTop: "8px",
        }}
      >
        {description}
      </p>
    </div>
  );
};

// 통계 카드
const StatCard = ({ title, value, color, icon }) => (
  <div
    style={{
      ...cardStyle,
      borderTop: `4px solid ${color}`,
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: "1.5rem",
        marginBottom: "5px",
      }}
    >
      {icon}
    </div>

    <div
      style={{
        color: "#888",
        fontSize: "0.85rem",
      }}
    >
      {title}
    </div>

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

// 차트 컨테이너
const ChartContainer = ({ title, children }) => (
  <div style={cardStyle}>
    <h3
      style={{
        marginBottom: "20px",
        fontSize: "1rem",
        color: "#444",
      }}
    >
      {title}
    </h3>

    <div
      style={{
        width: "100%",
        height: "300px",
      }}
    >
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  </div>
);

// 스타일
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
  alignItems: "flex-start",
  marginBottom: "30px",
};

const datePickerContainer = {
  display: "flex",
  alignItems: "center",
  backgroundColor: "#fff",
  padding: "10px 15px",
  borderRadius: "10px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
};

const dateInputStyle = {
  border: "none",
  outline: "none",
  fontSize: "0.9rem",
  color: "#555",
};

const quickBtnStyle = {
  padding: "8px 14px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const searchBtnStyle = {
  marginLeft: "10px",
  padding: "8px 14px",
  border: "none",
  borderRadius: "8px",
  backgroundColor: "#228be6",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const downloadBtnStyle = {
  marginLeft: "10px",
  padding: "8px 14px",
  border: "none",
  borderRadius: "8px",
  backgroundColor: "#40c057",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const loadingStyle = {
  padding: "100px",
  textAlign: "center",
  fontSize: "1.1rem",
  color: "#666",
};

export default OwnerStatsPage;
