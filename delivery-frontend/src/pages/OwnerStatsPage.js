function OwnerStatsPage() {
  const { storeId } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ 1. 기간 상태 추가 (기본값: 최근 7일)
  const [dates, setDates] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const token = localStorage.getItem("token");

  // ✅ 2. 요일 매핑 보완 (영어/숫자 모두 대응)
  const DAY_MAP = {
    MONDAY: "월",
    TUESDAY: "화",
    WEDNESDAY: "수",
    THURSDAY: "목",
    FRIDAY: "금",
    SATURDAY: "토",
    SUNDAY: "일",
    1: "일",
    2: "월",
    3: "화",
    4: "수",
    5: "목",
    6: "금",
    7: "토",
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:8080/api/owner/stats/${storeId}`,
        {
          params: { startDate: dates.startDate, endDate: dates.endDate }, // ✅ 파라미터 전송
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const formattedStats = {
        ...res.data,
        dayOfWeekStats: res.data.dayOfWeekStats.map((d) => ({
          ...d,
          // 요일 데이터가 영어 대문자나 숫자로 올 때 대응
          day: DAY_MAP[d.day?.toUpperCase()] || DAY_MAP[d.day] || d.day,
        })),
      };
      setStats(formattedStats);
    } catch (error) {
      toast.error("통계 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [storeId, dates]); // ✅ 날짜가 바뀔 때마다 다시 호출

  if (loading && !stats)
    return <div style={loadingStyle}>매장 데이터를 분석 중입니다... 📊</div>;

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={headerStyle}>
        <div>
          <h2 style={{ fontSize: "2rem", color: "#333" }}>
            🏪 매장 운영 정밀 리포트
          </h2>
          <p style={{ color: "#666" }}>
            가게의 매출 추이와 주문 패턴을 분석한 결과입니다.
          </p>
        </div>

        {/* ✅ 3. 기간 선택 UI 추가 */}
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
        {/* ✅ 백엔드에서 준 averageOrderValue 사용 */}
        <StatCard
          title="평균 객단가"
          value={`${stats.averageOrderValue?.toLocaleString()}원`}
          color="#e67e22"
        />
      </div>

      {/* ... 나머지 차트 영역 동일 ... */}
    </div>
  );
}

// 추가된 스타일들
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  marginBottom: "40px",
  borderBottom: "2px solid #eee",
  paddingBottom: "20px",
};

const datePickerContainer = {
  display: "flex",
  alignItems: "center",
  backgroundColor: "#fff",
  padding: "10px",
  borderRadius: "8px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};

const dateInputStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  borderRadius: "4px",
  fontSize: "0.9rem",
};
