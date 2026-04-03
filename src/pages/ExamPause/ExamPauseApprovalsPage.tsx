import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { examSessionService } from "../../api/services/examSessionService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Table from "../../components/ui/Table";
import type { PendingSystemPauseItem } from "../../types/examSession";
import { formatDateTime } from "../../utils/examUi";

const reasonLabel = (code?: string | null): string => {
  switch (code) {
    case "NETWORK_LOSS":
      return "Mất mạng";
    case "PAGE_RELOAD":
      return "Tải lại trang";
    case "HEARTBEAT_TIMEOUT":
      return "Mất heartbeat";
    case "CRASH_OR_UNKNOWN":
      return "Sự cố không xác định";
    default:
      return code ?? "—";
  }
};

const ExamPauseApprovalsPage = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PendingSystemPauseItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDisqualify, setConfirmDisqualify] = useState<string | null>(
    null,
  );
  const [confirmSubmit, setConfirmSubmit] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await examSessionService.getPendingSystemPauses();
      setItems(list);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Không thể tải danh sách sự cố",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = useCallback(
    async (
      sessionId: string,
      decision: "RESUME" | "SUBMIT" | "DISQUALIFY",
    ) => {
      setBusyId(sessionId);
      try {
        await examSessionService.resolveSystemPause(sessionId, { decision });
        toast.success("Đã xử lý phiên thi.");
        await load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Không thể xử lý");
      } finally {
        setBusyId(null);
        setConfirmDisqualify(null);
        setConfirmSubmit(null);
      }
    },
    [load],
  );

  const columns = useMemo(
    () => [
      {
        key: "examTitle" as const,
        title: "Đề thi",
      },
      {
        key: "student" as const,
        title: "Học sinh",
        render: (row: PendingSystemPauseItem) => (
          <>
            {row.studentFullName}
            <br />
            <span className="muted-text">{row.studentEmail ?? ""}</span>
          </>
        ),
      },
      {
        key: "reason" as const,
        title: "Lý do",
        render: (row: PendingSystemPauseItem) => (
          <>{reasonLabel(row.systemPauseReason)}</>
        ),
      },
      {
        key: "paused" as const,
        title: "Thời điểm",
        render: (row: PendingSystemPauseItem) => (
          <>
            {row.systemPausedAt ? formatDateTime(row.systemPausedAt) : "—"}
          </>
        ),
      },
      {
        key: "violationCount" as const,
        title: "Vi phạm",
      },
      {
        key: "actions" as const,
        title: "Hành động",
        render: (row: PendingSystemPauseItem) => (
          <div className="exam-pause-page__actions">
            <Button
              size="sm"
              disabled={busyId === row.sessionId}
              onClick={() => void resolve(row.sessionId, "RESUME")}
            >
              Cho thi tiếp
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busyId === row.sessionId}
              onClick={() => setConfirmSubmit(row.sessionId)}
            >
              Nộp bài hộ
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busyId === row.sessionId}
              onClick={() => setConfirmDisqualify(row.sessionId)}
            >
              Loại bài
            </Button>
          </div>
        ),
      },
    ],
    [busyId, resolve],
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="exam-pause-page">
      <div className="exam-pause-page__header">
        <h1 className="exam-pause-page__title">Phiên thi chờ xử lý sự cố</h1>
        <Button variant="outline" onClick={() => void load()}>
          Làm mới
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={items}
          rowKey={(row) => row.sessionId}
          emptyText="Không có phiên nào đang chờ xử lý."
        />
      </Card>

      <ConfirmModal
        open={Boolean(confirmSubmit)}
        title="Nộp bài thay học sinh?"
        message="Bài sẽ được chấm và kết thúc phiên theo đáp án đã lưu."
        confirmLabel="Nộp bài"
        cancelLabel="Hủy"
        variant="primary"
        loading={Boolean(busyId)}
        onConfirm={() => {
          if (confirmSubmit) void resolve(confirmSubmit, "SUBMIT");
        }}
        onCancel={() => setConfirmSubmit(null)}
      />

      <ConfirmModal
        open={Boolean(confirmDisqualify)}
        title="Loại bài (cấm kết quả)?"
        message="Phiên sẽ kết thúc với điểm 0 và trạng thái loại do quản trị viên."
        confirmLabel="Xác nhận loại"
        cancelLabel="Hủy"
        variant="primary"
        loading={Boolean(busyId)}
        onConfirm={() => {
          if (confirmDisqualify) void resolve(confirmDisqualify, "DISQUALIFY");
        }}
        onCancel={() => setConfirmDisqualify(null)}
      />
    </div>
  );
};

export default ExamPauseApprovalsPage;
