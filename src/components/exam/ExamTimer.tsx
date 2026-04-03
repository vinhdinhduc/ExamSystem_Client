import { useEffect, useMemo, useRef } from "react";
import { IoTimeOutline } from "react-icons/io5";

interface ExamTimerProps {
  seconds: number;
  onTick: (nextSeconds: number) => void;
  onExpire: () => void;
  /** Dừng đếm khi tạm dừng sự cố / mất mạng */
  paused?: boolean;
}

const ExamTimer = ({ seconds, onTick, onExpire, paused = false }: ExamTimerProps) => {
  const prevSecondsRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) {
      prevSecondsRef.current = seconds;
      return;
    }

    if (seconds <= 0) {
      const prev = prevSecondsRef.current;
      prevSecondsRef.current = seconds;
      // Chỉ hết giờ khi vừa đếm từ >0 về 0. Không gọi onExpire khi unpause với 0 (tránh admin cho tiếp tục → tự nộp bài).
      const crossedFromPositive = prev !== null && prev > 0;
      if (crossedFromPositive) {
        onExpire();
      }
      return;
    }

    prevSecondsRef.current = seconds;
    const timerId = window.setTimeout(() => {
      onTick(seconds - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [seconds, onExpire, onTick, paused]);

  const label = useMemo(() => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }, [seconds]);

  return (
    <div
      className={`exam-timer ${seconds < 300 ? "exam-timer--urgent" : ""}`.trim()}
    >
      <IoTimeOutline className="exam-timer__icon" />
      <div>
        <span className="exam-timer__label">Thời gian còn lại</span>
        <strong className="exam-timer__value">{label}</strong>
      </div>
    </div>
  );
};

export default ExamTimer;
