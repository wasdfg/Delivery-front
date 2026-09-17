import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function AdminNoticeDetailPage() {
  const { noticeId } = useParams();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [important, setImportant] = useState(false);
  const [visible, setVisible] = useState(false);

  const [loading, setLoading] = useState(false);

  const getNotice = async () => {
    try {
      const response = await axios.get(`/api/admin/notices/${noticeId}`);

      const data = response.data;

      setNotice(data);
      setTitle(data.title);
      setContent(data.content);
      setImportant(data.important);
      setVisible(data.visible);
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "공지사항을 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    getNotice();
  }, [noticeId]);

  const handleChange = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      await axios.patch(`/api/admin/notices/${noticeId}/change`, {
        title,
        content,
        important,
        visible,
      });

      alert("공지사항이 수정되었습니다.");

      await getNotice();
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "공지사항 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("공지사항을 비게시 상태로 변경하시겠습니까?")) {
      return;
    }

    try {
      setLoading(true);

      await axios.delete(`/api/admin/notices/${noticeId}`);

      alert("공지사항이 비게시 처리되었습니다.");

      await getNotice();
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "공지사항 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);

      await axios.patch(`/api/admin/notices/${noticeId}/restore`, null, {
        params: {
          visible: true,
        },
      });

      alert("공지사항이 다시 게시되었습니다.");

      await getNotice();
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "공지사항 복구에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!notice) {
    return <div>공지사항을 불러오는 중...</div>;
  }

  return (
    <div>
      <h1>공지사항 상세</h1>

      <div>
        <label>번호</label>
        <div>{notice.id}</div>
      </div>

      <div>
        <label>제목</label>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <label>내용</label>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          disabled={loading}
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={important}
            onChange={(e) => setImportant(e.target.checked)}
            disabled={loading}
          />
          중요 공지
        </label>
      </div>

      <div>게시 여부 : {visible ? "게시중" : "비게시"}</div>

      <div>조회수 : {notice.viewCount}</div>

      <div>등록일 : {notice.createdAt}</div>

      <div>수정일 : {notice.updatedAt}</div>

      <div>
        <button
          type="button"
          onClick={() => navigate("/admin/notices")}
          disabled={loading}
        >
          목록
        </button>

        <button type="button" onClick={handleChange} disabled={loading}>
          수정
        </button>

        {visible ? (
          <button type="button" onClick={handleDelete} disabled={loading}>
            비게시
          </button>
        ) : (
          <button type="button" onClick={handleRestore} disabled={loading}>
            다시 게시
          </button>
        )}
      </div>
    </div>
  );
}

export default AdminNoticeDetailPage;
