import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#4dabf7", "#ff922b", "#51cf66", "#f06595", "#845ef7"];

function AdminStatsPage() {
  const { token } = useAuth();

  const today = new Date();

  const [searchParams] = useSearchParams();

  const storeId = searchParams.get("storeId");

  const storeName = searchParams.get("name");

  const [startDate, setStartDate] = useState(
    new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
      .toISOString()
      .substring(0, 10),
  );

  const [endDate, setEndDate] = useState(today.toISOString().substring(0, 10));

  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    if (!storeId) return;

    try {
      const res = await axios.get("http://localhost:8080/api/admin/stats", {
        params: {
          storeId,
          startDate,
          endDate,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStats(res.data);
    } catch (e) {
      console.error(e);
      alert("통계 조회 실패");
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchStats();
    }
  }, [storeId]);

  return (
    <div style={{ padding: 30 }}>
      <h1>통계</h1>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 30,
          alignItems: "center",
        }}
      >
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button onClick={fetchStats}>조회</button>
      </div>

      {!stats && <div>조회할 가게를 선택하세요.</div>}

      {stats && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 20,
              marginBottom: 40,
            }}
          >
            <Card title="총 매출" value={stats.totalSales.toLocaleString()} />
            <Card title="주문수" value={stats.completedOrderCount} />
            <Card
              title="평균 주문금액"
              value={stats.averageOrderValue.toLocaleString()}
            />
            <Card
              title="재주문율"
              value={`${stats.customerRetentionRate.toFixed(1)}%`}
            />
            <Card
              title="취소율"
              value={`${stats.cancellationRate.toFixed(1)}%`}
            />
            <Card title="평점" value={stats.averageRating.toFixed(1)} />
          </div>

          <h2>일별 매출</h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.dailySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="totalSales" />
            </LineChart>
          </ResponsiveContainer>

          <br />

          <h2>시간대별 주문</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.hourlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orderCount" />
            </BarChart>
          </ResponsiveContainer>

          <br />

          <h2>인기 메뉴</h2>

          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={stats.topMenus}
                dataKey="count"
                nameKey="menuName"
                outerRadius={120}
                label
              >
                {stats.topMenus.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 20,
        textAlign: "center",
      }}
    >
      <h3>{title}</h3>
      <h2>{value}</h2>
    </div>
  );
}

export default AdminStatsPage;
