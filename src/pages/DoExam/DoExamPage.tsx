import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IoArrowBackOutline,
  IoArrowForwardOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { isAxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { examSessionService } from "../../api/services/examSessionService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ExamTimer from "../../components/exam/ExamTimer";
import QuestionCard from "../../components/exam/QuestionCard";
import QuestionPalette from "../../components/exam/QuestionPalette";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { fetchExamById } from "../../redux/slices/examSlice";
import {
  clearSessionState,
  setCurrentQuestion,
  setRemainingTime,
  setSessionAnswer,
  startExamSession,
  syncTimerFromServer,
} from "../../redux/slices/examSessionSlice";
import { fetchQuestionsByExamId } from "../../redux/slices/questionSlice";
import type { RootState } from "../../redux/store";
import type {
  ExamViolationRequest,
  SystemInterruptionType,
} from "../../types/examSession";
import { formatDateTime, normalizeExamStatus } from "../../utils/examUi";

const MAX_VIOLATIONS = 3;

/** Parse hạn nộp từ API: chuỗi không có Z/offset thì coi là UTC (tránh trình duyệt hiểu nhầm giờ địa phương → còn 0 giây). */
const remainingSecondsFromExpiresIso = (
  iso: string | null | undefined,
): number | null => {
  if (!iso) {
    return null;
  }
  let normalized = iso.trim();
  if (
    !/[zZ]$/.test(normalized) &&
    !/[+-]\d{2}:?\d{2}$/.test(normalized)
  ) {
    normalized = `${normalized}Z`;
  }
  const endMs = new Date(normalized).getTime();
  if (!Number.isFinite(endMs)) {
    return null;
  }
  return Math.max(0, Math.floor((endMs - Date.now()) / 1000));
};

const DoExamPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { examDetail } = useAppSelector((state: RootState) => state.exam);
  const { questions, loading: questionsLoading } = useAppSelector(
    (state: RootState) => state.question,
  );
  const { user } = useAppSelector((state: RootState) => state.auth);
  const {
    starting,
    sessionId,
    answers,
    currentQuestion,
    remainingTime,
    expiresAt: sessionExpiresAt,
    questionOrder,
    questionAnswerOrder,
    error,
  } = useAppSelector((state: RootState) => state.examSession);

  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreenEnabled, setIsFullscreenEnabled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  /** Chờ quản trị viên sau khi báo sự cố mềm (mạng / reload / …) */
  const [serverWaitingAdmin, setServerWaitingAdmin] = useState(false);
  /** Đang gửi báo cáo reload lên server */
  const [reloadReporting, setReloadReporting] = useState(false);
  const [localViolationCount, setLocalViolationCount] = useState(0);

  const hasAutoSubmitted = useRef(false);
  const hasAttemptedStartRef = useRef(false);
  const saveProgressDebounce = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reloadReportSentRef = useRef(false);
  const prevRuntimeStatusRef = useRef<number | null>(null);
  /** Sau khi admin cho tiếp tục: bỏ qua ghi nhận vi phạm anticheat một lúc (tránh tab/fullscreen do vào lại bài). */
  const resumeAnticheatGraceUntilRef = useRef(0);
  /** Hết giờ chỉ kích hoạt nộp một lần (Strict Mode / re-render không spam submit). */
  const timerExpireSubmitOnceRef = useRef(false);
  /** Theo dõi vừa rồi có đang fullscreen không (tránh stale closure khi báo EXIT_FULLSCREEN). */
  const hadFullscreenRef = useRef(false);

  const pauseStorageKey = useMemo(() => `exam-paused-${id}`, [id]);

  const examBlocked =
    isOffline || serverWaitingAdmin || reloadReporting;

  const scheduleBlockMessage = useMemo(() => {
    if (!examDetail || examDetail.id !== id) {
      return null;
    }

    if (normalizeExamStatus(examDetail.status) !== "Published") {
      return "Đề thi chưa được xuất bản nên chưa thể bắt đầu làm bài.";
    }

    const normalizedError = (error ?? "").toLowerCase();
    const notStartedByBackend =
      normalizedError.includes("not started") ||
      normalizedError.includes("chưa bắt đầu");

    if (notStartedByBackend && examDetail.startDate) {
      return `Bài thi chưa mở. Thời gian bắt đầu: ${formatDateTime(examDetail.startDate)}.`;
    }

    return null;
  }, [examDetail, error, id]);

  const orderedQuestions = useMemo(() => {
    if (!questions.length) {
      return [];
    }

    const questionMap = new Map(
      questions.map((question) => [question.id, question]),
    );
    const ordered = questionOrder
      .map((questionId) => questionMap.get(questionId))
      .filter((question): question is NonNullable<typeof question> =>
        Boolean(question),
      );

    const sourceQuestions = ordered.length > 0 ? ordered : questions;

    return sourceQuestions.map((question) => {
      const answerOrder = questionAnswerOrder[question.id];
      if (!answerOrder || answerOrder.length === 0) {
        return question;
      }

      const options = [...(question.options ?? question.answers ?? [])];
      options.sort((a, b) => {
        const aIndex = answerOrder.indexOf(a.id);
        const bIndex = answerOrder.indexOf(b.id);
        const resolvedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
        const resolvedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
        return resolvedA - resolvedB;
      });

      return { ...question, options };
    });
  }, [questionAnswerOrder, questionOrder, questions]);

  const currentQ = orderedQuestions[currentQuestion] ?? null;

  /** requestFullscreen chỉ tin cậy sau tương tác người dùng; gọi từ useEffect sẽ bị từ chối → không toast trừ khi warnOnFailure. */
  const enableFullscreen = useCallback(
    async (options?: { warnOnFailure?: boolean }) => {
      const warnOnFailure = options?.warnOnFailure ?? false;
      if (document.fullscreenElement) {
        setIsFullscreenEnabled(true);
        return;
      }

      try {
        const elem = document.documentElement as HTMLElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
          setIsFullscreenEnabled(true);
        }
      } catch {
        setIsFullscreenEnabled(false);
        if (warnOnFailure) {
          toast.warn(
            "Trình duyệt từ chối fullscreen. Vui lòng cho phép để tiếp tục làm bài.",
          );
        }
      }
    },
    [],
  );

  const safeExitFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) return;

    try {
      await document.exitFullscreen();
    } catch {
      // Ignore fullscreen exit error.
    } finally {
      setIsFullscreenEnabled(false);
    }
  }, []);

  const reportSoftInterruption = useCallback(
    async (type: SystemInterruptionType) => {
      if (!sessionId || hasAutoSubmitted.current) {
        return;
      }

      try {
        await examSessionService.reportSystemInterruption({
          sessionId,
          userId: user?.id,
          type,
          currentQuestionIndex: currentQuestion,
        });
        setServerWaitingAdmin(true);
        const pendingKey = `exam-interrupt-pending-${sessionId}`;
        sessionStorage.removeItem(pendingKey);
      } catch {
        if (sessionId) {
          sessionStorage.setItem(
            `exam-interrupt-pending-${sessionId}`,
            type,
          );
        }
      }
    },
    [currentQuestion, sessionId, user?.id],
  );

  const handleSubmit = useCallback(async () => {
    if (!sessionId || hasAutoSubmitted.current || isSubmitting) {
      return;
    }

    hasAutoSubmitted.current = true;
    setIsSubmitting(true);
    setIsFullscreenEnabled(false);
    sessionStorage.removeItem(pauseStorageKey);
    await safeExitFullscreen();

    try {
      const payload = await examSessionService.submitExamV1({
        sessionId,
        userId: user?.id,
      });

      toast.success("Nộp bài thành công!");
      navigate(`/result/${payload.sessionId}`, {
        replace: true,
        state: {
          summary: {
            sessionId: payload.sessionId,
            score: payload.score,
            isPassed: payload.isPassed,
            totalCorrect: payload.totalCorrect,
            submittedAt: payload.submittedAt,
            status: payload.status,
            totalQuestions: orderedQuestions.length,
            examTitle: examDetail?.title,
          },
        },
      });
    } catch (err: unknown) {
      hasAutoSubmitted.current = false;
      setIsSubmitting(false);

      let apiMessage: string | null = null;
      if (isAxiosError(err)) {
        const data = err.response?.data as
          | { message?: string; error?: { reason?: string } }
          | undefined;
        apiMessage = data?.message ?? data?.error?.reason ?? null;
      } else if (err instanceof Error) {
        apiMessage = err.message;
      }

      const pauseLike =
        Boolean(apiMessage) &&
        (apiMessage!.includes("tạm dừng") ||
          apiMessage!.includes("quản trị viên"));

      if (pauseLike) {
        setServerWaitingAdmin(true);
        toast.warn(
          apiMessage ??
            "Phiên thi đang tạm dừng chờ quản trị viên. Chưa thể nộp bài cho đến khi được xử lý.",
        );
      } else {
        toast.error(apiMessage || "Không thể nộp bài, vui lòng thử lại.");
      }

      if (!examBlocked && !isOffline) {
        void enableFullscreen();
      }
    }
  }, [
    enableFullscreen,
    examBlocked,
    examDetail?.title,
    isOffline,
    isSubmitting,
    navigate,
    orderedQuestions.length,
    pauseStorageKey,
    safeExitFullscreen,
    sessionId,
    user?.id,
  ]);

  const handleExamTimerExpire = useCallback(() => {
    if (timerExpireSubmitOnceRef.current) {
      return;
    }
    timerExpireSubmitOnceRef.current = true;
    if (examBlocked) {
      toast.info(
        "Đã hết thời gian làm bài. Phiên đang tạm dừng — vui lòng chờ quản trị viên xử lý hoặc dùng Nộp bài khi được phép.",
      );
      return;
    }
    void handleSubmit();
  }, [examBlocked, handleSubmit]);

  const reportViolation = useCallback(
    async (type: ExamViolationRequest["type"]) => {
      if (
        !sessionId ||
        hasAutoSubmitted.current ||
        isOffline ||
        serverWaitingAdmin ||
        reloadReporting
      ) {
        return;
      }

      if (Date.now() < resumeAnticheatGraceUntilRef.current) {
        return;
      }

      try {
        const payload = await examSessionService.reportViolation({
          sessionId,
          userId: user?.id,
          type,
          currentQuestionIndex: currentQuestion,
        });

        const count = payload.violationCount;
        setLocalViolationCount(count);

        if (payload.status === 4) {
          setServerWaitingAdmin(true);
          return;
        }

        if (
          payload.isForceSubmitted ||
          count >= MAX_VIOLATIONS ||
          payload.status === 3
        ) {
          toast.error(
            "Bạn đã vi phạm quá số lần cho phép. Hệ thống sẽ tự động nộp bài.",
          );
          void handleSubmit();
          return;
        }

        toast.warn(`Vi phạm quy định làm bài: ${count}/${MAX_VIOLATIONS}.`);
      } catch {
        // Lỗi mạng / phiên tạm dừng: không tăng vi phạm cục bộ, không tự nộp (tránh coi sự cố mạng như gian lận).
        try {
          const s = await examSessionService.getSessionRuntimeStatus(sessionId);
          setLocalViolationCount(s.violationCount);
          if (s.status === 4) {
            setServerWaitingAdmin(true);
          }
        } catch {
          // Bỏ qua — poll định kỳ sẽ đồng bộ.
        }
        toast.warn(
          "Không ghi nhận vi phạm do lỗi kết nối hoặc phiên đang tạm dừng. Hệ thống sẽ đồng bộ khi có mạng.",
        );
      }
    },
    [
      currentQuestion,
      handleSubmit,
      isOffline,
      reloadReporting,
      serverWaitingAdmin,
      sessionId,
      user?.id,
    ],
  );

  const saveProgress = useCallback(
    async (questionId: string, selectedIds: number[]) => {
      if (!sessionId || isOffline || examBlocked || hasAutoSubmitted.current) {
        return;
      }

      try {
        const payload = await examSessionService.saveProgress({
          sessionId,
          userId: user?.id,
          questionId,
          answerIds: selectedIds,
          currentQuestionIndex: currentQuestion,
        });

        setLocalViolationCount(payload.violationCount);

        if (
          payload.isAutoSubmitted ||
          payload.status === 2 ||
          payload.status === 3
        ) {
          toast.error(
            "Phiên thi đã tự động nộp. Hệ thống sẽ chuyển sang trang kết quả.",
          );
          void handleSubmit();
        }
      } catch {
        // Skip hard-fail: next change will retry save-progress.
      }
    },
    [currentQuestion, examBlocked, handleSubmit, isOffline, sessionId, user?.id],
  );

  const handleAnswer = useCallback(
    (questionId: string, selectedIds: number[]) => {
      if (examBlocked || isOffline || isSubmitting) {
        toast.info("Bài thi đang tạm dừng. Vui lòng chờ quản trị viên hoặc kết nối mạng.");
        return;
      }

      dispatch(setSessionAnswer({ questionId, answerIds: selectedIds }));

      if (saveProgressDebounce.current) {
        clearTimeout(saveProgressDebounce.current);
      }

      saveProgressDebounce.current = setTimeout(() => {
        void saveProgress(questionId, selectedIds);
      }, 800);
    },
    [dispatch, examBlocked, isOffline, isSubmitting, saveProgress],
  );

  useEffect(() => {
    if (!currentQ || isOffline || examBlocked || isSubmitting) {
      return;
    }

    if (saveProgressDebounce.current) {
      clearTimeout(saveProgressDebounce.current);
    }

    saveProgressDebounce.current = setTimeout(() => {
      void saveProgress(currentQ.id, answers[currentQ.id] ?? []);
    }, 600);
  }, [answers, currentQ, examBlocked, isOffline, isSubmitting, saveProgress]);

  useEffect(() => {
    if (!id) {
      return;
    }

    hasAutoSubmitted.current = false;
    hasAttemptedStartRef.current = false;
    setLocalViolationCount(0);
    reloadReportSentRef.current = false;
    prevRuntimeStatusRef.current = null;
    timerExpireSubmitOnceRef.current = false;

    void dispatch(fetchExamById(id));
    void dispatch(fetchQuestionsByExamId(id));

    return () => {
      if (saveProgressDebounce.current) {
        clearTimeout(saveProgressDebounce.current);
      }
      dispatch(clearSessionState());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (!id || !examDetail || examDetail.id !== id) {
      return;
    }

    if (sessionId || starting || hasAttemptedStartRef.current) {
      return;
    }

    if (scheduleBlockMessage) {
      return;
    }

    hasAttemptedStartRef.current = true;
    void dispatch(
      startExamSession({ examId: id, userId: user?.id, accessCode: null }),
    );
  }, [
    dispatch,
    examDetail,
    id,
    scheduleBlockMessage,
    sessionId,
    starting,
    user?.id,
  ]);

  useEffect(() => {
    if (!sessionId || hasAutoSubmitted.current) {
      return;
    }

    const tick = async () => {
      try {
        const s = await examSessionService.getSessionRuntimeStatus(sessionId);
        const st = Number(
          s.status ?? (s as { status?: number; Status?: number }).Status,
        );
        setServerWaitingAdmin(st === 4);
        setLocalViolationCount(s.violationCount);
        // Đồng bộ hạn nộp + giây còn lại (sau tạm dừng / gia hạn; cập nhật cả expiresAt trong Redux).
        const expiresIso =
          s.expiresAt ??
          (s as { expiresAt?: string; ExpiresAt?: string }).ExpiresAt;
        if (st === 0 && expiresIso) {
          const secs = remainingSecondsFromExpiresIso(expiresIso);
          if (secs !== null) {
            if (secs > 0) {
              timerExpireSubmitOnceRef.current = false;
            }
            dispatch(
              syncTimerFromServer({
                expiresAt: expiresIso,
                remainingSeconds: secs,
              }),
            );
          }
        }
        if (prevRuntimeStatusRef.current === 4 && st === 0) {
          toast.success("Quản trị viên đã cho phép tiếp tục làm bài.");
          resumeAnticheatGraceUntilRef.current = Date.now() + 60_000;
          timerExpireSubmitOnceRef.current = false;
          void enableFullscreen();
        }
        prevRuntimeStatusRef.current = st;
      } catch {
        // Bỏ qua lỗi mạng khi poll.
      }
    };

    void tick();
    const intervalId = window.setInterval(() => void tick(), 2000);
    return () => window.clearInterval(intervalId);
  }, [dispatch, enableFullscreen, sessionId]);

  // remainingTime kẹt 0 nhưng hạn nộp trong Redux vẫn còn (race start / parse ngày / lỗi tạm thời) → bật lại đếm.
  useEffect(() => {
    if (!sessionId || hasAutoSubmitted.current || examBlocked) {
      return;
    }
    if (remainingTime > 0) {
      return;
    }
    const secs = remainingSecondsFromExpiresIso(sessionExpiresAt);
    if (secs === null || secs <= 0) {
      return;
    }
    timerExpireSubmitOnceRef.current = false;
    dispatch(setRemainingTime(secs));
  }, [
    dispatch,
    examBlocked,
    remainingTime,
    sessionExpiresAt,
    sessionId,
  ]);

  useEffect(() => {
    if (!sessionId || hasAutoSubmitted.current || examBlocked) {
      return;
    }

    const send = () => {
      void examSessionService.sendHeartbeat({
        sessionId,
        userId: user?.id,
      });
    };

    send();
    const intervalId = window.setInterval(send, 30_000);
    return () => window.clearInterval(intervalId);
  }, [examBlocked, sessionId, user?.id]);

  useEffect(() => {
    if (!sessionId || navigator.onLine) {
      return;
    }
    void reportSoftInterruption("NETWORK_LOSS");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || reloadReportSentRef.current) {
      return;
    }

    const wasPausedByReload = sessionStorage.getItem(pauseStorageKey) === "1";
    if (!wasPausedByReload) {
      return;
    }

    reloadReportSentRef.current = true;
    setReloadReporting(true);
    void (async () => {
      try {
        await examSessionService.reportSystemInterruption({
          sessionId,
          userId: user?.id,
          type: "PAGE_RELOAD",
          currentQuestionIndex: currentQuestion,
        });
        sessionStorage.removeItem(pauseStorageKey);
        setServerWaitingAdmin(true);
        toast.info(
          "Đã báo tải lại trang. Phiên thi tạm dừng chờ quản trị viên xử lý.",
        );
      } catch {
        toast.warn("Không thể đồng bộ trạng thái reload. Sẽ thử lại khi có mạng.");
      } finally {
        setReloadReporting(false);
      }
    })();
  }, [currentQuestion, pauseStorageKey, sessionId, user?.id]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (!sessionId) {
        toast.success("Đã có kết nối mạng.");
        return;
      }

      const pending = sessionStorage.getItem(
        `exam-interrupt-pending-${sessionId}`,
      );
      if (pending === "NETWORK_LOSS" || pending === "PAGE_RELOAD") {
        sessionStorage.removeItem(`exam-interrupt-pending-${sessionId}`);
        void reportSoftInterruption(pending as SystemInterruptionType);
        return;
      }

      toast.success("Đã có kết nối mạng.");
    };

    const handleOffline = () => {
      setIsOffline(true);
      void reportSoftInterruption("NETWORK_LOSS");
      toast.warn("Mất kết nối mạng. Phiên thi tạm dừng chờ quản trị viên xử lý.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [reportSoftInterruption, sessionId]);

  useEffect(() => {
    if (!sessionId || hasAutoSubmitted.current) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      sessionStorage.setItem(pauseStorageKey, "1");
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pauseStorageKey, sessionId]);

  useEffect(() => {
    if (!sessionId || examBlocked || isOffline || hasAutoSubmitted.current) {
      return;
    }

    // Không gọi requestFullscreen ở đây: trình duyệt yêu cầu cử chỉ người dùng (click) mới cho phép.
    const fsNow = Boolean(document.fullscreenElement);
    setIsFullscreenEnabled(fsNow);
    hadFullscreenRef.current = fsNow;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        void reportViolation("TAB_SWITCH");
      }
    };

    const handleFullscreenChange = () => {
      const nowFs = Boolean(document.fullscreenElement);
      setIsFullscreenEnabled(nowFs);
      if (!nowFs && hadFullscreenRef.current) {
        void reportViolation("EXIT_FULLSCREEN");
        void enableFullscreen();
      }
      hadFullscreenRef.current = nowFs;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isDevTools =
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && ["i", "j"].includes(key));

      const isCopy = (event.ctrlKey || event.metaKey) && key === "c";
      const isPaste = (event.ctrlKey || event.metaKey) && key === "v";

      if (isDevTools) {
        event.preventDefault();
        void reportViolation("DEVTOOLS");
      }

      if (isCopy) {
        event.preventDefault();
        void reportViolation("COPY");
      }

      if (isPaste) {
        event.preventDefault();
        void reportViolation("PASTE");
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      void reportViolation("COPY");
    };

    const handleCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      void reportViolation("COPY");
    };

    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      void reportViolation("PASTE");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [enableFullscreen, examBlocked, isOffline, reportViolation, sessionId]);

  const handleRetryStartSession = () => {
    if (!id) return;
    hasAttemptedStartRef.current = true;
    void dispatch(
      startExamSession({ examId: id, userId: user?.id, accessCode: null }),
    );
  };

  const handleManualSubmit = () => {
    setIsConfirmSubmitOpen(true);
  };

  const answeredMap: Record<number, boolean> = {};
  orderedQuestions.forEach((question, index) => {
    answeredMap[index] = (answers[question.id]?.length ?? 0) > 0;
  });
  const answeredCount = Object.values(answeredMap).filter(Boolean).length;
  const progressPct = orderedQuestions.length
    ? Math.round((answeredCount / orderedQuestions.length) * 100)
    : 0;

  if (questionsLoading || starting) {
    return <LoadingSpinner />;
  }

  if (!sessionId) {
    return (
      <div className="do-exam">
        <Card>
          <p className="error-text">
            {scheduleBlockMessage ??
              error ??
              "Không thể khởi tạo ca thi. Vui lòng thử lại hoặc liên hệ quản trị viên."}
          </p>
          <div className="do-exam__submit-wrap">
            <Button
              onClick={handleRetryStartSession}
              disabled={Boolean(scheduleBlockMessage)}
            >
              Thử lại
            </Button>
            <Button variant="outline" onClick={() => navigate("/exams")}>
              Quay lại danh sách đề
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const showFullscreenPrompt =
    Boolean(sessionId) &&
    !examBlocked &&
    !isOffline &&
    !isFullscreenEnabled;

  return (
    <div className="do-exam">
      {showFullscreenPrompt && (
        <Card className="do-exam__fullscreen-prompt">
          <div className="do-exam__fullscreen-prompt-inner">
            <p className="do-exam__fullscreen-prompt-text">
              Trình duyệt chỉ cho phép bật toàn màn hình sau khi bạn nhấn nút. Vui
              lòng bật để tiếp tục làm bài theo quy chế thi.
            </p>
            <Button
              type="button"
              onClick={() => void enableFullscreen({ warnOnFailure: true })}
            >
              Bật toàn màn hình
            </Button>
          </div>
        </Card>
      )}

      {examBlocked && (
        <Card>
          <p className="error-text">
            {isOffline
              ? "Mất kết nối mạng. Phiên thi đang tạm dừng; khi có mạng hệ thống sẽ đồng bộ sự cố."
              : reloadReporting
                ? "Đang đồng bộ trạng thái sau khi tải lại trang…"
                : serverWaitingAdmin
                  ? "Phiên thi đang tạm dừng chờ quản trị viên xử lý sự cố (mạng / reload / …). Bạn không thể tự tiếp tục cho đến khi được phép."
                  : "Bài thi đang tạm dừng."}
          </p>
        </Card>
      )}

      <div className="do-exam__main">
        <div className="do-exam__header">
          <h1 className="do-exam__title">
            {examDetail?.title ?? "Làm bài thi"}
          </h1>
          <ExamTimer
            seconds={remainingTime}
            paused={examBlocked}
            onTick={(next) => {
              if (!examBlocked) {
                dispatch(setRemainingTime(next));
              }
            }}
            onExpire={handleExamTimerExpire}
          />
        </div>

        {currentQ ? (
          <>
            <QuestionCard
              question={currentQ}
              index={currentQuestion + 1}
              value={answers[currentQ.id] ?? []}
              onChange={(ids) => handleAnswer(currentQ.id, ids)}
            />
            <div className="do-exam__nav">
              <Button
                variant="outline"
                iconLeft={<IoArrowBackOutline />}
                disabled={currentQuestion === 0 || examBlocked}
                onClick={() =>
                  dispatch(setCurrentQuestion(currentQuestion - 1))
                }
              >
                Câu trước
              </Button>
              <span className="do-exam__counter">
                {currentQuestion + 1} / {orderedQuestions.length}
              </span>
              <Button
                iconRight={<IoArrowForwardOutline />}
                disabled={
                  currentQuestion === orderedQuestions.length - 1 ||
                  examBlocked
                }
                onClick={() =>
                  dispatch(setCurrentQuestion(currentQuestion + 1))
                }
              >
                Câu tiếp
              </Button>
            </div>
          </>
        ) : (
          <p className="error-text">Không có câu hỏi nào.</p>
        )}
      </div>

      <div className="do-exam__sidebar">
        <QuestionPalette
          total={orderedQuestions.length}
          current={currentQuestion}
          answeredMap={answeredMap}
          onSelect={(idx) => {
            if (examBlocked) {
              return;
            }
            dispatch(setCurrentQuestion(idx));
          }}
        />

        <Card>
          <p className="do-exam__progress">
            Đã trả lời: <strong>{answeredCount}</strong> /{" "}
            {orderedQuestions.length}
          </p>
          <p className="do-exam__progress">
            Vi phạm: {localViolationCount}/{MAX_VIOLATIONS}
          </p>
          <div className="do-exam__progress-bar">
            <div
              className="do-exam__progress-bar-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="do-exam__submit-wrap">
            <Button
              fullWidth
              iconLeft={<IoCheckmarkCircleOutline />}
              disabled={isSubmitting || examBlocked}
              onClick={handleManualSubmit}
            >
              {isSubmitting ? "Đang nộp..." : "Nộp bài"}
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmModal
        open={isConfirmSubmitOpen}
        title="Xác nhận nộp bài"
        message={`Bạn đã trả lời ${answeredCount}/${orderedQuestions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài ngay bây giờ không?`}
        confirmLabel="Nộp bài"
        cancelLabel="Quay lại làm tiếp"
        variant="primary"
        loading={isSubmitting}
        onConfirm={() => {
          setIsConfirmSubmitOpen(false);
          void handleSubmit();
        }}
        onCancel={() => setIsConfirmSubmitOpen(false)}
      />
    </div>
  );
};

export default DoExamPage;
