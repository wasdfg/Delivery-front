import React from "react";

function CategoryNav({ selectedCategory, onSelectCategory }) {
  // ✅ 카테고리 목록 정의 (ID는 DB와 일치시켜야 합니다)
  const categories = [
    { id: "", name: "전체" },
    { id: 1, name: "치킨" },
    { id: 2, name: "피자" },
    { id: 3, name: "한식" },
    { id: 4, name: "중식" },
    { id: 5, name: "일식" },
  ];

  return (
    <nav style={navStyle}>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)} // ✅ 이제 숫자를 넘깁니다.
          style={{
            ...buttonStyle,
            // ✅ 비교 로직도 숫자 타입에 맞게 작동합니다.
            backgroundColor:
              selectedCategory === cat.id ? "#ff6b6b" : "#f1f3f5",
            color: selectedCategory === cat.id ? "#white" : "#333",
            fontWeight: selectedCategory === cat.id ? "bold" : "normal",
          }}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}

const navStyle = {
  display: "flex",
  gap: "10px",
  overflowX: "auto",
  padding: "10px 0",
};

const buttonStyle = {
  padding: "8px 16px",
  borderRadius: "20px",
  border: "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "all 0.2s",
};

export default CategoryNav;
