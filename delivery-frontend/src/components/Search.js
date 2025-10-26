import React, { useState } from "react";

function Search() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="가게 이름을 검색하세요"
        onChange={handleChange}
        // value는 이제 부모가 관리하므로, 여기서는 제거해도 됩니다.
      />
    </div>
  );
}

export default Search;
