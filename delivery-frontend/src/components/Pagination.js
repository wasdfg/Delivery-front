import React from "react";

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const pageGroup = Math.floor(page / 5);

  const startPage = pageGroup * 5;

  const endPage = Math.min(startPage + 5, totalPages);

  const pages = [];

  for (let i = startPage; i < endPage; i++) {
    pages.push(i);
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "6px",
        marginTop: "25px",
      }}
    >
      {/* 첫 페이지 */}
      <button disabled={page === 0} onClick={() => onPageChange(0)}>
        {"<<"}
      </button>

      {/* 이전 */}
      <button disabled={page === 0} onClick={() => onPageChange(page - 1)}>
        {"<"}
      </button>

      {/* 페이지 번호 */}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          style={{
            width: "36px",
            height: "36px",
            fontWeight: p === page ? "bold" : "normal",
            backgroundColor: p === page ? "#1976d2" : "#fff",
            color: p === page ? "#fff" : "#000",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {p + 1}
        </button>
      ))}

      {/* 다음 */}
      <button
        disabled={page + 1 >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {">"}
      </button>

      {/* 마지막 페이지 */}
      <button
        disabled={page + 1 >= totalPages}
        onClick={() => onPageChange(totalPages - 1)}
      >
        {">>"}
      </button>
    </div>
  );
}

export default Pagination;
