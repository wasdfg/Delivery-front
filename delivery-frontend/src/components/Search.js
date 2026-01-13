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
      />
    </div>
  );
}

export default Search;
