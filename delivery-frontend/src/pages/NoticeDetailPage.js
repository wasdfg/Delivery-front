import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function NoticeDetailPage() {
  const { noticeId } = useParams();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);

  useEffect(() => {
    getNotice();
  }, [noticeId]);

  const getNotice = async () => {
    try {
      const response = await axios.get(`/api/notices/${noticeId}`);

      setNotice(response.data);
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "공지사항을 불러오지 못했습니다.");
    }
  };

  if (!notice) {
    return <div>공지사항을 불러오는 중...</div>;
  }

  return (
    <div>
      <h1>{notice.title}</h1>

      <div>{notice.important && <span>중요 공지</span>}</div>

      <div>등록일 : {notice.createdAt}</div>

      <div>조회수 : {notice.viewCount}</div>

      <hr />

      <div>{notice.content}</div>

      <button type="button" onClick={() => navigate("/notices")}>
        목록
      </button>
    </div>
  );
}

export default NoticeDetailPage;
