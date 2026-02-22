import React, { useState } from "react";
import axios from "axios";

function ProductOptionModal({ product, onClose, onAddToCart }) {
  // 선택된 옵션 ID들을 관리하는 상태
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [quantity, setQuantity] = useState(1);

  // 옵션 선택 핸들러
  const handleOptionChange = (optionGroupId, optionId, isRequired) => {
    setSelectedOptionIds((prev) => {
      // 만약 필수(Radio) 그룹이라면, 해당 그룹의 다른 옵션을 제거하고 새 옵션 추가
      // (이 예시는 간단하게 체크박스 형태로 구현하며, 로직은 필요에 따라 확장 가능)
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  const handleAddClick = () => {
    // 백엔드 CartItemRequest 구조에 맞춰 데이터 전송
    const cartData = {
      productId: product.productId,
      quantity: quantity,
      optionIds: selectedOptionIds,
    };
    onAddToCart(cartData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} style={{ float: "right" }}>
          X
        </button>
        <img
          src={product.imageUrl}
          alt={product.name}
          style={{ width: "100%" }}
        />
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <h3>기본 가격: {product.price.toLocaleString()}원</h3>

        <hr />

        {/* 옵션 그룹 렌더링 */}
        {product.optionGroups.map((group) => (
          <div key={group.optionGroupId} style={{ marginBottom: "20px" }}>
            <h4>
              {group.name}{" "}
              {group.isRequired && <span style={{ color: "red" }}>(필수)</span>}
            </h4>
            {group.options.map((opt) => (
              <div key={opt.optionId}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedOptionIds.includes(opt.optionId)}
                    onChange={() =>
                      handleOptionChange(
                        group.optionGroupId,
                        opt.optionId,
                        group.isRequired
                      )
                    }
                  />
                  {opt.name} (+{opt.additionalPrice.toLocaleString()}원)
                </label>
              </div>
            ))}
          </div>
        ))}

        <hr />

        <div className="quantity-control">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
            -
          </button>
          <span> {quantity} </span>
          <button onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>

        <button onClick={handleAddClick} className="add-to-cart-btn">
          장바구니 담기
        </button>
      </div>
    </div>
  );
}

export default ProductOptionModal;
