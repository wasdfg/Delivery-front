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

  // 상태 변경
  const [status, setStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");

  // 취소
  const [cancelReason, setCancelReason] = useState("");

  // 삭제
  const [deleteReason, setDeleteReason] = useState("");

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
      setStatus(res.data.status);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ?? "주문 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // -------------------------
  // 상태 변경
  // -------------------------
  const handleStatusChange = async () => {
    if (!status) {
      toast.error("변경할 상태를 선택해주세요.");
      return;
    }

    if (!statusReason.trim()) {
      toast.error("상태 변경 사유를 입력해주세요.");
      return;
    }

    if (status === "CANCELED") {
      toast.error("주문 취소는 '주문 취소' 기능을 이용해주세요.");
      return;
    }

    if (status === order.status) {
      toast.error("현재 상태와 동일합니다.");
      return;
    }

    if (!window.confirm(`주문 상태를 ${status}로 변경하시겠습니까?`)) {
      return;
    }

    try {
      await axios.patch(
        `http://localhost:8080/api/admin/orders/${orderId}/status`,
        {
          status,
          reason: statusReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("주문 상태가 변경되었습니다.");

      setStatusReason("");

      await fetchOrder();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ?? "주문 상태 변경에 실패했습니다.",
      );
    }
  };

  // -------------------------
  // 주문 취소
  // -------------------------
  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("취소 사유를 입력해주세요.");
      return;
    }

    if (order.status === "CANCELED") {
      toast.error("이미 취소된 주문입니다.");
      return;
    }

    if (
      !window.confirm(
        `정말 주문을 취소하시겠습니까?\n\n취소 사유: ${cancelReason}`,
      )
    ) {
      return;
    }

    try {
      await axios.patch(
        `http://localhost:8080/api/admin/orders/${orderId}/cancel`,
        {
          reason: cancelReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("주문이 취소되었습니다.");

      setCancelReason("");

      await fetchOrder();
    } catch (err) {
      console.error(err);

      toast.error(err.response?.data?.message ?? "주문 취소에 실패했습니다.");
    }
  };

  // -------------------------
  // 주문 삭제
  // -------------------------
  const handleDelete = async () => {
    if (!deleteReason.trim()) {
      toast.error("삭제 사유를 입력해주세요.");
      return;
    }

    if (
      !window.confirm(
        `정말 주문을 삭제하시겠습니까?\n\n삭제 사유: ${deleteReason}`,
      )
    ) {
      return;
    }

    try {
      await axios.patch(
        `http://localhost:8080/api/admin/orders/${orderId}/delete`,
        {
          reason: deleteReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("주문이 삭제 처리되었습니다.");

      navigate("/admin/orders");
    } catch (err) {
      console.error(err);

      toast.error(err.response?.data?.message ?? "주문 삭제에 실패했습니다.");
    }
  };

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

      {/* 주문 기본 정보 */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
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
              <td>{order.id}</td>
            </tr>

            <tr>
              <th>고객</th>
              <td>{order.nickname}</td>
            </tr>

            <tr>
              <th>고객 전화번호</th>
              <td>{order.phone}</td>
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
              <th>주문일시</th>
              <td>
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString("ko-KR")
                  : "-"}
              </td>
            </tr>

            <tr>
              <th>배송 주소</th>
              <td>{order.deliveryAddress}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 주문 상품 */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
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

      {/* 관리자 처리 */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
        <h2>관리자 처리</h2>

        {/* 상태 변경 */}
        <div
          style={{
            borderBottom: "1px solid #eee",
            paddingBottom: "25px",
            marginBottom: "25px",
          }}
        >
          <h3>주문 상태 변경</h3>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">상태 선택</option>

              <option value="REQUESTED">REQUESTED</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="DELIVERING">DELIVERING</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>

            <input
              type="text"
              placeholder="상태 변경 사유"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              style={{
                flex: 1,
                minWidth: "250px",
              }}
            />

            <button onClick={handleStatusChange}>상태 변경</button>
          </div>
        </div>

        {/* 주문 취소 */}
        <div
          style={{
            borderBottom: "1px solid #eee",
            paddingBottom: "25px",
            marginBottom: "25px",
          }}
        >
          <h3>주문 취소</h3>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="취소 사유"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{
                flex: 1,
              }}
            />

            <button
              onClick={handleCancel}
              disabled={order.status === "CANCELED"}
            >
              주문 취소
            </button>
          </div>
        </div>

        {/* 주문 삭제 */}
        <div>
          <h3>주문 삭제</h3>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="삭제 사유"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              style={{
                flex: 1,
              }}
            />

            <button onClick={handleDelete}>주문 삭제</button>
          </div>
        </div>
      </section>

      <button onClick={() => navigate("/admin/orders")}>주문 목록으로</button>
    </div>
  );
}

export default AdminOrderDetailPage;
