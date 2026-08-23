import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination";

function AdminOrderPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const [condition, setCondition] = useState({
    orderId: "",
    userKeyword: "",
    storeKeyword: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const params = {
        page,
        size: 10,

        orderId: condition.orderId || null,
        userKeyword: condition.userKeyword || null,
        storeKeyword: condition.storeKeyword || null,
        status: condition.status || null,
        startDate: condition.startDate || null,
        endDate: condition.endDate || null,
      };

      const res = await axios.get("http://localhost:8080/api/admin/orders", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message ?? "주문 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handleSearch = () => {
    if (page !== 0) {
      setPage(0);
    } else {
      fetchOrders();
    }
  };

  const handleReset = () => {
    setCondition({
      orderId: "",
      userKeyword: "",
      storeKeyword: "",
      status: "",
      startDate: "",
      endDate: "",
    });

    if (page !== 0) {
      setPage(0);
    } else {
      fetchOrders();
    }
  };

  return (
    <div
      style={{
        maxWidth: "1300px",
        margin: "30px auto",
      }}
    >
      <h1>주문 관리</h1>

      {/* 검색 조건 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        <input
          type="number"
          placeholder="주문 ID"
          value={condition.orderId}
          onChange={(e) =>
            setCondition({
              ...condition,
              orderId: e.target.value,
            })
          }
        />

        <input
          placeholder="주문자"
          value={condition.userKeyword}
          onChange={(e) =>
            setCondition({
              ...condition,
              userKeyword: e.target.value,
            })
          }
        />

        <input
          placeholder="가게명"
          value={condition.storeKeyword}
          onChange={(e) =>
            setCondition({
              ...condition,
              storeKeyword: e.target.value,
            })
          }
        />

        <select
          value={condition.status}
          onChange={(e) =>
            setCondition({
              ...condition,
              status: e.target.value,
            })
          }
        >
          <option value="">전체 상태</option>

          <option value="REQUESTED">REQUESTED</option>
          <option value="ACCEPTED">ACCEPTED</option>
          <option value="DELIVERING">DELIVERING</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELED">CANCELED</option>
        </select>

        <input
          type="date"
          value={condition.startDate}
          onChange={(e) =>
            setCondition({
              ...condition,
              startDate: e.target.value,
            })
          }
        />

        <span>~</span>

        <input
          type="date"
          value={condition.endDate}
          onChange={(e) =>
            setCondition({
              ...condition,
              endDate: e.target.value,
            })
          }
        />

        <button onClick={handleSearch}>검색</button>

        <button onClick={handleReset}>초기화</button>
      </div>

      {loading && <p>조회 중...</p>}

      {/* 주문 목록 */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>주문자</th>
            <th>가게</th>
            <th>상태</th>
            <th>주문금액</th>
            <th>주문일</th>
            <th>상세</th>
          </tr>
        </thead>

        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                주문이 없습니다.
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.orderId}>
                <td>{order.orderId}</td>

                <td>{order.userNickname}</td>

                <td>{order.storeName}</td>

                <td>{order.status}</td>

                <td>{order.totalPrice?.toLocaleString()}원</td>

                <td>{formatDate(order.createdAt)}</td>

                <td>
                  <button
                    onClick={() => navigate(`/admin/orders/${order.orderId}`)}
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

function formatDate(date) {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleString("ko-KR");
}

export default AdminOrderPage;
