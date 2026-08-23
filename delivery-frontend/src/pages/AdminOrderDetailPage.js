import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

function AdminOrderDetailPage() {
  const { token } = useAuth();
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:8080/api/admin/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setOrder(res.data);
    } catch (err) {
      console.error(err);

      toast.error(err.response?.data?.message ?? "주문 상세 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <h3>조회 중...</h3>;
  }

  if (!order) {
    return <h3>주문 정보를 찾을 수 없습니다.</h3>;
  }

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "30px auto",
      }}
    >
      <h1>주문 상세</h1>

      {/* 기본 주문 정보 */}
      <section>
        <h2>주문 정보</h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              <th>주문 ID</th>
              <td>{order.orderId}</td>
            </tr>

            <tr>
              <th>주문자</th>
              <td>{order.userNickname}</td>
            </tr>

            <tr>
              <th>전화번호</th>
              <td>{order.userPhone}</td>
            </tr>

            <tr>
              <th>가게</th>
              <td>{order.storeName}</td>
            </tr>

            <tr>
              <th>주문 상태</th>
              <td>{order.status}</td>
            </tr>

            <tr>
              <th>총 주문금액</th>
              <td>{order.totalPrice?.toLocaleString()}원</td>
            </tr>

            <tr>
              <th>주문일</th>
              <td>{formatDate(order.createdAt)}</td>
            </tr>

            <tr>
              <th>배송 주소</th>
              <td>{order.deliveryAddress}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 주문 상품 */}
      <section style={{ marginTop: "40px" }}>
        <h2>주문 상품</h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th>상품</th>
              <th>수량</th>
              <th>가격</th>
            </tr>
          </thead>

          <tbody>
            {order.items?.map((item, index) => (
              <tr key={item.id ?? index}>
                <td>{item.productName}</td>

                <td>{item.quantity}</td>

                <td>{item.price?.toLocaleString()}원</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div style={{ marginTop: "30px" }}>
        <button onClick={() => navigate("/admin/orders")}>목록으로</button>
      </div>
    </div>
  );
}

function formatDate(date) {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleString("ko-KR");
}

export default AdminOrderDetailPage;
