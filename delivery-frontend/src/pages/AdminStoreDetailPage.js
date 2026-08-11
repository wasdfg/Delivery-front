import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

function AdminStoreDetailPage() {
  const { token } = useAuth();
  const { storeId } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStore = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:8080/api/admin/stores/${storeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setStore(res.data);
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ?? "가게 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !storeId) {
      return;
    }

    fetchStore();
  }, [token, storeId]);

  if (loading) {
    return (
      <div
        style={{
          maxWidth: "1000px",
          margin: "30px auto",
        }}
      >
        <h3>조회 중...</h3>
      </div>
    );
  }

  if (!store) {
    return (
      <div
        style={{
          maxWidth: "1000px",
          margin: "30px auto",
        }}
      >
        <h3>가게 정보를 찾을 수 없습니다.</h3>

        <button onClick={() => navigate("/admin/stores")}>목록으로</button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "30px auto",
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
        <h1>가게 상세</h1>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={() => navigate(`/admin/stats?storeId=${store.storeId}`)}
          >
            통계 보기
          </button>

          <button onClick={() => navigate("/admin/stores")}>목록으로</button>
        </div>
      </div>

      {/* 기본 정보 */}
      <section style={sectionStyle}>
        <h2>기본 정보</h2>

        <table style={tableStyle}>
          <tbody>
            <tr>
              <th style={thStyle}>가게 ID</th>
              <td style={tdStyle}>{store.storeId}</td>
            </tr>

            <tr>
              <th style={thStyle}>가게명</th>
              <td style={tdStyle}>{store.name}</td>
            </tr>

            <tr>
              <th style={thStyle}>점주 ID</th>
              <td style={tdStyle}>{store.ownerId}</td>
            </tr>

            <tr>
              <th style={thStyle}>점주 닉네임</th>
              <td style={tdStyle}>{store.ownerNickname}</td>
            </tr>

            <tr>
              <th style={thStyle}>전화번호</th>
              <td style={tdStyle}>{store.phone}</td>
            </tr>

            <tr>
              <th style={thStyle}>주소</th>
              <td style={tdStyle}>{store.address}</td>
            </tr>

            <tr>
              <th style={thStyle}>카테고리</th>
              <td style={tdStyle}>{store.categoryName}</td>
            </tr>

            <tr>
              <th style={thStyle}>소개</th>
              <td style={tdStyle}>
                {store.description || "등록된 소개가 없습니다."}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 운영 정보 */}
      <section style={sectionStyle}>
        <h2>운영 정보</h2>

        <table style={tableStyle}>
          <tbody>
            <tr>
              <th style={thStyle}>운영 상태</th>
              <td style={tdStyle}>
                <StatusBadge
                  value={store.active}
                  trueText="운영중"
                  falseText="중지"
                />
              </td>
            </tr>

            <tr>
              <th style={thStyle}>삭제 상태</th>
              <td style={tdStyle}>
                <StatusBadge
                  value={!store.deleted}
                  trueText="정상"
                  falseText="삭제"
                />
              </td>
            </tr>

            <tr>
              <th style={thStyle}>운영시간</th>
              <td style={tdStyle}>{store.operatingHours || "등록되지 않음"}</td>
            </tr>

            <tr>
              <th style={thStyle}>최소 주문금액</th>
              <td style={tdStyle}>{formatNumber(store.minOrderAmount)}원</td>
            </tr>

            <tr>
              <th style={thStyle}>배달비</th>
              <td style={tdStyle}>{formatNumber(store.deliveryFee)}원</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 평가 정보 */}
      <section style={sectionStyle}>
        <h2>평가 정보</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "15px",
          }}
        >
          <InfoBox title="평균 평점" value={`${store.averageRating ?? 0}점`} />

          <InfoBox
            title="리뷰 수"
            value={`${formatNumber(store.reviewCount)}개`}
          />

          <InfoBox
            title="메뉴 수"
            value={`${formatNumber(store.productCount)}개`}
          />
        </div>
      </section>

      {/* 매출 정보 */}
      <section style={sectionStyle}>
        <h2>매출 정보</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
          }}
        >
          <InfoBox
            title="총 주문 수"
            value={`${formatNumber(store.totalOrderCount)}건`}
          />

          <InfoBox
            title="총 매출"
            value={`${formatNumber(store.totalSales)}원`}
          />

          <InfoBox
            title="평균 주문금액"
            value={`${formatNumber(store.averageOrderPrice)}원`}
          />

          <InfoBox
            title="취소 건수"
            value={`${formatNumber(store.canceledOrderCount)}건`}
          />
        </div>
      </section>

      {/* 기타 정보 */}
      <section style={sectionStyle}>
        <h2>기타 정보</h2>

        <table style={tableStyle}>
          <tbody>
            <tr>
              <th style={thStyle}>가게 이미지</th>
              <td style={tdStyle}>
                {store.imageUrl ? (
                  <img
                    src={store.imageUrl}
                    alt={store.name}
                    style={{
                      width: "150px",
                      height: "150px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  "등록된 이미지가 없습니다."
                )}
              </td>
            </tr>

            <tr>
              <th style={thStyle}>등록일</th>
              <td style={tdStyle}>{formatDate(store.createdAt)}</td>
            </tr>

            <tr>
              <th style={thStyle}>수정일</th>
              <td style={tdStyle}>{formatDate(store.updatedAt)}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}

function InfoBox({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "#666",
          marginBottom: "10px",
        }}
      >
        {title}
      </div>

      <strong
        style={{
          fontSize: "22px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function StatusBadge({ value, trueText, falseText }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 10px",
        borderRadius: "5px",
        backgroundColor: value ? "#e8f5e9" : "#ffebee",
      }}
    >
      {value ? trueText : falseText}
    </span>
  );
}

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "0";
  }

  return Number(value).toLocaleString();
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("ko-KR");
}

const sectionStyle = {
  marginBottom: "30px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = {
  width: "180px",
  padding: "12px",
  border: "1px solid #ddd",
  backgroundColor: "#f5f5f5",
  textAlign: "left",
};

const tdStyle = {
  padding: "12px",
  border: "1px solid #ddd",
};

export default AdminStoreDetailPage;
