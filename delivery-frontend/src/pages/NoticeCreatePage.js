import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminNoticePage() {
  const navigate = useNavigate();

  const [notices, setNotices] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);

  const [condition, setCondition] = useState({
    keyword: "",
    important: "",
    visible: "",
  });

  const [page, setPage] = useState(0);

  useEffect(() => {
    getNotices();
  }, [page]);

  const getNotices = async () => {
    try {
      const params = {
        page,
        size: 10,
        sort: "createdAt,desc",
      };

      Object.entries(condition).forEach(([key, value]) => {
        if (value !== "") {
          params[key] = value;
        }
      });

      const response = await axios.get("/api/admin/notices", {
        params,
      });

      setNotices(response.data.content);
      setPageInfo(response.data);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message || "공지사항 목록을 불러오지 못했습니다.",
      );
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setCondition((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    if (page === 0) {
      getNotices();
    } else {
      setPage(0);
    }
  };

  const handleReset = () => {
    setCondition({
      keyword: "",
      important: "",
      visible: "",
    });

    if (page === 0) {
      setTimeout(() => {
        getNotices();
      }, 0);
    } else {
      setPage(0);
    }
  };

  const handleCreate = () => {
    navigate("/admin/notices/create");
  };

  const handleNoticeClick = (noticeId) => {
    navigate(`/admin/notices/${noticeId}`);
  };

  return (
    <div>
      <h1>공지사항 관리</h1>

      {/* 검색 */}
      <div>
        <input
          type="text"
          name="keyword"
          value={condition.keyword}
          onChange={handleChange}
          placeholder="제목 또는 내용 검색"
        />

        <select
          name="important"
          value={condition.important}
          onChange={handleChange}
        >
          <option value="">중요 여부 전체</option>
          <option value="true">중요 공지</option>
          <option value="false">일반 공지</option>
        </select>

        <select
          name="visible"
          value={condition.visible}
          onChange={handleChange}
        >
          <option value="">게시 여부 전체</option>
          <option value="true">게시중</option>
          <option value="false">비게시</option>
        </select>

        <button type="button" onClick={handleSearch}>
          검색
        </button>

        <button type="button" onClick={handleReset}>
          초기화
        </button>

        <button type="button" onClick={handleCreate}>
          공지 등록
        </button>
      </div>

      {/* 목록 */}
      <table>
        <thead>
          <tr>
            <th>번호</th>
            <th>중요</th>
            <th>제목</th>
            <th>게시 여부</th>
            <th>조회수</th>
            <th>등록일</th>
          </tr>
        </thead>

        <tbody>
          {notices.length === 0 ? (
            <tr>
              <td colSpan="6">공지사항이 없습니다.</td>
            </tr>
          ) : (
            notices.map((notice) => (
              <tr
                key={notice.id}
                onClick={() => handleNoticeClick(notice.id)}
                style={{ cursor: "pointer" }}
              >
                <td>{notice.id}</td>

                <td>{notice.important ? "중요" : ""}</td>

                <td>{notice.title}</td>

                <td>{notice.visible ? "게시중" : "비게시"}</td>

                <td>{notice.viewCount}</td>

                <td>{notice.createdAt}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      {pageInfo && (
        <div>
          <button
            type="button"
            disabled={pageInfo.first}
            onClick={() => setPage((prev) => prev - 1)}
          >
            이전
          </button>

          <span>
            {pageInfo.number + 1}
            {" / "}
            {pageInfo.totalPages}
          </span>

          <button
            type="button"
            disabled={pageInfo.last}
            onClick={() => setPage((prev) => prev + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminNoticePage;
