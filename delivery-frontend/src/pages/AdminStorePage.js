import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function AdminStorePage() {
  const { token } = useAuth();

  const navigate = useNavigate();

  const [stores, setStores] = useState([]);

  const [condition, setCondition] = useState({
    keyword: "",
    ownerId: "",
    active: "",
    deleted: "",
  });

  const [page, setPage] = useState(0);

  const fetchStores = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/admin/stores", {
        params: {
          ...condition,
          page,
          size: 10,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStores(res.data.content);
    } catch {
      toast.error("가게 조회 실패");
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
    setPage(0);

    fetchStores();
  };

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
                  onChange={(e) =>
                    updateStore(store.storeId, "active", e.target.value)
                  }
                >
                  <option value={true}>운영</option>

                  <option value={false}>중지</option>
                </select>
              </td>

              <td>
                <select
                  value={store.deleted}
                  onChange={(e) =>
                    updateStore(store.storeId, "deleted", e.target.value)
                  }
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

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "10px",
        }}
      >
        <button disabled={page === 0} onClick={() => setPage(page - 1)}>
          이전
        </button>

        <button onClick={() => setPage(page + 1)}>다음</button>
      </div>
    </div>
  );
}

export default AdminStorePage;
