import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination";

function AdminStorePage() {
  const { token } = useAuth();

  const navigate = useNavigate();

  const [stores, setStores] = useState([]);

  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const [condition, setCondition] = useState({
    keyword: "",
    categoryId: "",
    active: "",
    deleted: "",
    ownerId: "",
  });

  const [page, setPage] = useState(0);

  const fetchStores = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:8080/api/admin/stores", {
        params: {
          page,
          size: 10,
          keyword: condition.keyword,
          categoryId: condition.categoryId || null,
          active: condition.active,
          deleted: condition.deleted,
          ownerId: condition.ownerId || null,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStores(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch {
      console.error(err);

      toast.error(err.response?.data?.message ?? "가게 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [page]);

  const updateStore = async (storeId, field, value) => {
    try {
      await axios.patch(
        `http://localhost:8080/api/admin/stores/${storeId}`,
        {
          [field]: value,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("변경 완료");

      fetchStores();
    } catch {
      toast.error("변경 실패");
    }
  };

  const handleSearch = () => {
    if (page !== 0) {
      setPage(0);
    } else {
      fetchStores();
    }
  };

  if (loading) {
    return <h3>조회 중...</h3>;
  }

  return (
    <div>
      <h1>가게 관리</h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <input
          placeholder="가게명"
          value={condition.keyword}
          onChange={(e) =>
            setCondition({
              ...condition,
              keyword: e.target.value,
            })
          }
        />

        <input
          placeholder="점주 ID"
          value={condition.ownerId}
          onChange={(e) =>
            setCondition({
              ...condition,
              ownerId: e.target.value,
            })
          }
        />

        <select
          value={condition.categoryId}
          onChange={(e) =>
            setCondition({
              ...condition,
              categoryId: e.target.value,
            })
          }
        >
          {" "}
          <option value="">전체 카테고리</option>
          <option value="1">치킨</option>
          <option value="2">피자</option>
          <option value="3">한식</option>
          ...
        </select>

        <select
          value={condition.active}
          onChange={(e) =>
            setCondition({
              ...condition,
              active: e.target.value,
            })
          }
        >
          <option value="">운영 전체</option>
          <option value="true">운영중</option>
          <option value="false">중지</option>
        </select>

        <select
          value={condition.deleted}
          onChange={(e) =>
            setCondition({
              ...condition,
              deleted: e.target.value,
            })
          }
        >
          <option value="">삭제 전체</option>
          <option value="true">삭제</option>
          <option value="false">정상</option>
        </select>

        <button onClick={handleSearch}>검색</button>
      </div>

      <table
        style={{
          width: "100%",
        }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>가게명</th>
            <th>점주</th>
            <th>운영</th>
            <th>삭제</th>
            <th>통계</th>
          </tr>
        </thead>

        <tbody>
          {stores.map((store) => (
            <tr key={store.storeId}>
              <td>{store.storeId}</td>

              <td>{store.name}</td>

              <td>{store.ownerId}</td>

              <td>
                <select
                  value={store.active}
                  onChange={(e) => {
                    const active = e.target.value === "true";

                    if (active === store.active) {
                      return;
                    }

                    if (
                      !window.confirm(
                        active
                          ? "운영을 재개하시겠습니까?"
                          : "운영을 중지하시겠습니까?",
                      )
                    ) {
                      return;
                    }

                    updateStore(store.storeId, "active", active);
                  }}
                >
                  <option value={true}>운영</option>

                  <option value={false}>중지</option>
                </select>
              </td>

              <td>
                <select
                  value={store.deleted}
                  onChange={(e) => {
                    const deleted = e.target.value === "true";

                    if (deleted === store.deleted) {
                      return;
                    }

                    if (
                      !window.confirm(
                        deleted
                          ? "가게를 삭제 처리하시겠습니까?"
                          : "삭제를 복구하시겠습니까?",
                      )
                    ) {
                      return;
                    }

                    updateStore(store.storeId, "deleted", deleted);
                  }}
                >
                  <option value={false}>정상</option>

                  <option value={true}>삭제</option>
                </select>
              </td>

              <td>
                <button
                  onClick={() =>
                    navigate(`/admin/stats?storeId=${store.storeId}`)
                  }
                >
                  통계
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default AdminStorePage;
