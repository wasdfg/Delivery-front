import { useEffect } from "react";
import { EventSourcePolyfill, NativeEventSource } from "event-source-polyfill";
import { toast } from "react-toastify";

const EventSource = EventSourcePolyfill || NativeEventSource;

export const useOrderNotification = (storeId) => {
  useEffect(() => {
    if (!storeId) return;

    const token = localStorage.getItem("token"); // 세션이나 로컬스토리지에서 토큰 가져오기

    // 1. SSE 연결 (헤더에 토큰 포함)
    const eventSource = new EventSource(
      `http://localhost:8080/api/notifications/subscribe/${storeId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        heartbeatTimeout: 3600000, // 1시간
      }
    );

    // 2. 초기 연결 성공 시
    eventSource.addEventListener("connect", (e) => {
      console.log("SSE 연결 성공:", e.data);
    });

    // 3. 백엔드에서 보낸 'newOrder' 이벤트 수신
    eventSource.addEventListener("newOrder", (e) => {
      const message = e.data;

      // 알림음 재생
      const audio = new Audio("/sounds/notification.mp3");
      audio.play().catch(() => console.log("사용자 상호작용 후 재생 가능"));

      // 토스트 알림 띄우기
      toast.info(`🔔 ${message}`, {
        position: "top-right",
        autoClose: 8000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });

    // 에러 발생 시 처리
    eventSource.onerror = (e) => {
      console.error("SSE 연결 에러:", e);
      if (e.readyState === EventSource.CLOSED) {
        console.log("SSE 연결 종료");
      }
      eventSource.close();
    };

    return () => {
      eventSource.close();
      console.log("SSE 연결 해제");
    };
  }, [storeId]);
};
