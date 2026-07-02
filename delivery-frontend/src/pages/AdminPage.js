import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./AdminPage.css";

function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const menus = [
    {
      title: "회원 관리",
      path: "/admin/users",
      icon: "👤",
    },
    {
      title: "가게 관리",
      path: "/admin/stores",
      icon: "🏪",
    },
    {
      title: "통계",
      path: "/admin/stats",
      icon: "📊",
    },
    {
      title: "정산",
      path: "/admin/settlements",
      icon: "💰",
    },
  ];

  return (
    <div className="admin-layout">
      {/* 사이드바 */}
      <aside className="admin-sidebar">
        <h2 className="admin-logo" onClick={() => navigate("/admin")}>
          관리자
        </h2>

        {menus.map((menu) => (
          <button
            key={menu.path}
            className={
              location.pathname.startsWith(menu.path)
                ? "admin-menu active"
                : "admin-menu"
            }
            onClick={() => navigate(menu.path)}
          >
            {menu.icon} {menu.title}
          </button>
        ))}
      </aside>

      {/* 본문 */}
      <main className="admin-content">
        {location.pathname === "/admin" ? (
          <div className="admin-home">
            <h1>관리자 페이지</h1>

            <p>왼쪽 메뉴를 선택해주세요.</p>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}

export default AdminPage;
