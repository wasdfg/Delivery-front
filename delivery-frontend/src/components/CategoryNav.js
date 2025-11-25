import React from "react";
import "./CategoryNav.css";

function CategoryNav({ selectedCategory, onSelectCategory }) {
  // 백엔드 ENUM 값과 일치시키는 것이 중요합니다!
  const categories = [
    { id: "", name: "전체" },
    { id: "CHICKEN", name: "치킨" },
    { id: "KOREAN_FOOD", name: "한식" },
    { id: "CHINESE_FOOD", name: "중식" },
    { id: "JAPANESE_FOOD", name: "일식" },
    { id: "PIZZA", name: "피자" },
    { id: "FAST_FOOD", name: "패스트푸드" },
    { id: "CAFE_DESSERT", name: "카페/디저트" },
    // ... 필요한 만큼 추가
  ];

  return (
    <div className="category-nav">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`category-btn ${
            selectedCategory === cat.id ? "active" : ""
          }`}
          onClick={() => onSelectCategory(cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

export default CategoryNav;
