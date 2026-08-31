import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import Pagination from "../components/Pagination";

function AdminProductPage() {
  const { token } = useAuth();

  // =========================
  // 목록
  // =========================
  const [products, setProducts] = useState([]);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);

  // =========================
  // 검색 조건
  // =========================
  const [productName, setProductName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [active, setActive] = useState("");
  const [deleted, setDeleted] = useState("");

  // 실제 조회에 적용된 검색 조건
  const [searchCondition, setSearchCondition] = useState({
    productName: "",
    storeName: "",
    active: "",
    deleted: "",
  });

  // =========================
  // 상세
  // =========================
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // =========================
  // 사유 입력
  // =========================
  const [reasonModal, setReasonModal] = useState(null);
  const [reason, setReason] = useState("");

  // =========================
  // 상품 목록 조회
  // =========================
  const fetchProducts = async () => {
    try {
      setLoading(true);

      const params = {
        page,
        size: 10,
      };

      if (searchCondition.productName) {
        params.productName = searchCondition.productName;
      }

      if (searchCondition.storeName) {
        params.storeName = searchCondition.storeName;
      }

      if (searchCondition.active !== "") {
        params.active = searchCondition.active;
      }

      if (searchCondition.deleted !== "") {
        params.deleted = searchCondition.deleted;
      }

      const res = await axios.get("http://localhost:8080/api/admin/products", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProducts(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
      toast.error("상품 목록 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 상세 조회
  // =========================
  const fetchProductDetail = async (productId) => {
    try {
      setDetailLoading(true);

      const res = await axios.get(
        `http://localhost:8080/api/admin/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSelectedProduct(res.data);
    } catch (err) {
      console.error(err);
      toast.error("상품 상세 조회에 실패했습니다.");
    } finally {
      setDetailLoading(false);
    }
  };

  // =========================
  // 검색
  // =========================
  const handleSearch = () => {
    setPage(0);

    setSearchCondition({
      productName,
      storeName,
      active,
      deleted,
    });
  };

  // =========================
  // 검색 조건 초기화
  // =========================
  const handleReset = () => {
    setProductName("");
    setStoreName("");
    setActive("");
    setDeleted("");

    setPage(0);

    setSearchCondition({
      productName: "",
      storeName: "",
      active: "",
      deleted: "",
    });
  };

  // =========================
  // 사유 입력창 열기
  // =========================
  const openReasonModal = (type, product) => {
    setReasonModal({
      type,
      product,
    });

    setReason("");
  };

  // =========================
  // 사유 입력창 닫기
  // =========================
  const closeReasonModal = () => {
    setReasonModal(null);
    setReason("");
  };

  // =========================
  // 상태 변경
  // =========================
  const changeProductStatus = async () => {
    if (!reason.trim()) {
      toast.warning("변경 사유를 입력해주세요.");
      return;
    }

    const product = reasonModal.product;

    try {
      await axios.patch(
        `http://localhost:8080/api/admin/products/${product.id}/status`,
        {
          reason: reason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("상품 판매 상태가 변경되었습니다.");

      closeReasonModal();

      await fetchProducts();

      if (selectedProduct?.id === product.id) {
        await fetchProductDetail(product.id);
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "상품 상태 변경에 실패했습니다.",
      );
    }
  };

  // =========================
  // 상품 삭제
  // =========================
  const deleteProduct = async () => {
    if (!reason.trim()) {
      toast.warning("삭제 사유를 입력해주세요.");
      return;
    }

    const product = reasonModal.product;

    try {
      await axios.patch(
        `http://localhost:8080/api/admin/products/${product.id}/delete`,
        {
          reason: reason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("상품이 삭제되었습니다.");

      closeReasonModal();

      await fetchProducts();

      if (selectedProduct?.id === product.id) {
        await fetchProductDetail(product.id);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "상품 삭제에 실패했습니다.");
    }
  };

  // =========================
  // 상품 복구
  // =========================
  const restoreProduct = async () => {
    if (!reason.trim()) {
      toast.warning("복구 사유를 입력해주세요.");
      return;
    }

    const product = reasonModal.product;

    try {
      await axios.patch(
        `http://localhost:8080/api/admin/products/${product.id}/restore`,
        {
          reason: reason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("상품이 복구되었습니다.");

      closeReasonModal();

      await fetchProducts();

      if (selectedProduct?.id === product.id) {
        await fetchProductDetail(product.id);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "상품 복구에 실패했습니다.");
    }
  };

  // =========================
  // 사유 확인
  // =========================
  const handleReasonSubmit = () => {
    if (!reasonModal) return;

    switch (reasonModal.type) {
      case "status":
        changeProductStatus();
        break;

      case "delete":
        deleteProduct();
        break;

      case "restore":
        restoreProduct();
        break;

      default:
        break;
    }
  };

  // =========================
  // 목록 조회
  // =========================
  useEffect(() => {
    fetchProducts();
  }, [page, searchCondition]);

  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "30px auto",
        padding: "0 20px",
      }}
    >
      <h1>상품 관리</h1>

      {/* =========================
          검색 영역
      ========================= */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
        <h3>상품 검색</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 180px 180px",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <input
            type="text"
            placeholder="상품명"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <input
            type="text"
            placeholder="가게명"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <select value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="">판매 상태 전체</option>
            <option value="true">판매중</option>
            <option value="false">판매중지</option>
          </select>

          <select value={deleted} onChange={(e) => setDeleted(e.target.value)}>
            <option value="">삭제 상태 전체</option>
            <option value="false">정상</option>
            <option value="true">삭제</option>
          </select>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button onClick={handleSearch}>조회</button>

          <button onClick={handleReset}>초기화</button>
        </div>
      </div>

      {/* =========================
          상품 목록
      ========================= */}
      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "20px",
            }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>상품명</th>
                <th>가게</th>
                <th>가격</th>
                <th>판매 상태</th>
                <th>삭제 상태</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                    }}
                  >
                    조회된 상품이 없습니다.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>

                    <td>{product.name}</td>

                    <td>{product.storeName || product.store?.name || "-"}</td>

                    <td>
                      {product.price != null
                        ? product.price.toLocaleString()
                        : "-"}
                      원
                    </td>

                    <td>
                      {product.active ? (
                        <span style={{ color: "green" }}>판매중</span>
                      ) : (
                        <span style={{ color: "red" }}>판매중지</span>
                      )}
                    </td>

                    <td>
                      {product.delete ? (
                        <span style={{ color: "red" }}>삭제</span>
                      ) : (
                        <span style={{ color: "green" }}>정상</span>
                      )}
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "5px",
                        }}
                      >
                        <button onClick={() => fetchProductDetail(product.id)}>
                          상세
                        </button>

                        <button
                          onClick={() => openReasonModal("status", product)}
                        >
                          {product.active ? "판매중지" : "판매재개"}
                        </button>

                        {!product.delete ? (
                          <button
                            onClick={() => openReasonModal("delete", product)}
                          >
                            삭제
                          </button>
                        ) : (
                          <button
                            onClick={() => openReasonModal("restore", product)}
                          >
                            복구
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {/* =========================
          상세 정보
      ========================= */}
      {selectedProduct && (
        <div
          style={{
            marginTop: "40px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "25px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2>상품 상세</h2>

            <button onClick={() => setSelectedProduct(null)}>닫기</button>
          </div>

          {detailLoading ? (
            <p>불러오는 중...</p>
          ) : (
            <div>
              <p>
                <strong>상품 ID:</strong> {selectedProduct.id}
              </p>

              <p>
                <strong>상품명:</strong> {selectedProduct.name}
              </p>

              <p>
                <strong>가게:</strong>{" "}
                {selectedProduct.storeName ||
                  selectedProduct.store?.name ||
                  "-"}
              </p>

              <p>
                <strong>가격:</strong>{" "}
                {selectedProduct.price != null
                  ? selectedProduct.price.toLocaleString()
                  : "-"}
                원
              </p>

              <p>
                <strong>판매 상태:</strong>{" "}
                {selectedProduct.active ? "판매중" : "판매중지"}
              </p>

              <p>
                <strong>삭제 상태:</strong>{" "}
                {selectedProduct.delete ? "삭제" : "정상"}
              </p>

              {selectedProduct.description && (
                <p>
                  <strong>상품 설명:</strong> {selectedProduct.description}
                </p>
              )}

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => openReasonModal("status", selectedProduct)}
                >
                  {selectedProduct.active ? "판매중지" : "판매재개"}
                </button>

                {!selectedProduct.delete ? (
                  <button
                    onClick={() => openReasonModal("delete", selectedProduct)}
                  >
                    삭제
                  </button>
                ) : (
                  <button
                    onClick={() => openReasonModal("restore", selectedProduct)}
                  >
                    복구
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================
          사유 입력 모달
      ========================= */}
      {reasonModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "30px",
              width: "450px",
            }}
          >
            <h2>
              {reasonModal.type === "status" && "판매 상태 변경"}

              {reasonModal.type === "delete" && "상품 삭제"}

              {reasonModal.type === "restore" && "상품 복구"}
            </h2>

            <p>
              상품명: <strong>{reasonModal.product.name}</strong>
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="처리 사유를 입력해주세요."
              rows={5}
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: "10px",
                padding: "10px",
                resize: "vertical",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button onClick={closeReasonModal}>취소</button>

              <button onClick={handleReasonSubmit}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductPage;
