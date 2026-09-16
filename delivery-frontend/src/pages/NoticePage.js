import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function NoticePage() {
  const navigate = useNavigate();

  const [notices, setNotices] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    getNotices();
  }, [page]);

  const getNotices = async () => {
    try {
      const response = await axios.get("/api/notices", {
        params: {
          page,
          size: 10,
          sort: "important,desc,createdAt,desc",
        },
      });

      setNotices(response.data.content);
      setPageInfo(response.data);
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "공지사항을 불러오지 못했습니다.");
    }
  };

  return (
    <div>
      <h1>공지사항</h1>

      <table>
        <thead>
          <tr>
            <th>중요</th>
            <th>제목</th>
            <th>조회수</th>
            <th>등록일</th>
          </tr>
        </thead>

        <tbody>
          {notices.length === 0 ? (
            <tr>
              <td colSpan="4">공지사항이 없습니다.</td>
            </tr>
          ) : (
            notices.map((notice) => (
              <tr
                key={notice.id}
                onClick={() => navigate(`/notices/${notice.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td>{notice.important ? "중요" : ""}</td>

                <td>{notice.title}</td>

                <td>{notice.viewCount}</td>

                <td>{notice.createdAt}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

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

export default NoticePage;
