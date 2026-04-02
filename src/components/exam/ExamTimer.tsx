import { useEffect, useMemo } from "react";
import { IoTimeOutline } from "react-icons/io5";

interface ExamTimerProps {
  seconds: number;
  onTick: (nextSeconds: number) => void;
  onExpire: () => void;
}

const ExamTimer = ({ seconds, onTick, onExpire }: ExamTimerProps) => {
  useEffect(() => {
    if (seconds <= 0) {
      onExpire();
      return;
    }

    const timerId = window.setTimeout(() => {
      onTick(seconds - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [seconds, onExpire, onTick]);

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
