import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IoArrowBackOutline,
  IoArrowForwardOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
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
} from "../../redux/slices/examSessionSlice";
import { fetchQuestionsByExamId } from "../../redux/slices/questionSlice";
import type { RootState } from "../../redux/store";
import type { ExamViolationRequest } from "../../types/examSession";
import { formatDateTime, normalizeExamStatus } from "../../utils/examUi";

const MAX_VIOLATIONS = 3;

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
    questionOrder,
    questionAnswerOrder,
    error,
  } = useAppSelector((state: RootState) => state.examSession);

  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreenEnabled, setIsFullscreenEnabled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isPaused, setIsPaused] = useState(false);
  const [localViolationCount, setLocalViolationCount] = useState(0);

  const hasAutoSubmitted = useRef(false);
  const hasAttemptedStartRef = useRef(false);
  const saveProgressDebounce = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const pauseStorageKey = useMemo(() => `exam-paused-${id}`, [id]);

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

  const enableFullscreen = useCallback(async () => {
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
      toast.warn(
        "Trình duyệt từ chối fullscreen. Vui lòng cho phép để tiếp tục làm bài.",
      );
    }
  }, []);

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
    } catch {
      hasAutoSubmitted.current = false;
      setIsSubmitting(false);
      toast.error("Không thể nộp bài, vui lòng thử lại.");
      if (!isPaused && !isOffline) {
        void enableFullscreen();
      }
    }
  }, [
    enableFullscreen,
    examDetail?.title,
    isOffline,
    isPaused,
    isSubmitting,
    navigate,
    orderedQuestions.length,
    pauseStorageKey,
    safeExitFullscreen,
    sessionId,
    user?.id,
  ]);

  const reportViolation = useCallback(
    async (type: ExamViolationRequest["type"]) => {
      if (!sessionId || hasAutoSubmitted.current) {
        return;
      }

      const fallbackCount = localViolationCount + 1;
      setLocalViolationCount(fallbackCount);

      try {
        const payload = await examSessionService.reportViolation({
          sessionId,
          userId: user?.id,
          type,
          currentQuestionIndex: currentQuestion,
        });

        const count = payload.violationCount;
        setLocalViolationCount(count);

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
        if (fallbackCount >= MAX_VIOLATIONS) {
          toast.error(
            "Bạn đã vi phạm quá số lần cho phép. Hệ thống sẽ tự động nộp bài.",
          );
          void handleSubmit();
          return;
        }

        toast.warn(
          `Vi phạm quy định làm bài: ${fallbackCount}/${MAX_VIOLATIONS}.`,
        );
      }
    },
    [currentQuestion, handleSubmit, localViolationCount, sessionId, user?.id],
  );

  const saveProgress = useCallback(
    async (questionId: string, selectedIds: number[]) => {
      if (!sessionId || isOffline || isPaused || hasAutoSubmitted.current) {
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
    [currentQuestion, handleSubmit, isOffline, isPaused, sessionId, user?.id],
  );

  const handleAnswer = useCallback(
    (questionId: string, selectedIds: number[]) => {
      if (isPaused || isOffline || isSubmitting) {
        toast.info("Bài thi đang tạm dừng. Vui lòng tiếp tục để trả lời.");
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
    [dispatch, isOffline, isPaused, isSubmitting, saveProgress],
  );

  useEffect(() => {
    if (!currentQ || isOffline || isPaused || isSubmitting) {
      return;
    }

    if (saveProgressDebounce.current) {
      clearTimeout(saveProgressDebounce.current);
    }

    saveProgressDebounce.current = setTimeout(() => {
      void saveProgress(currentQ.id, answers[currentQ.id] ?? []);
    }, 600);
  }, [answers, currentQ, isOffline, isPaused, isSubmitting, saveProgress]);

  useEffect(() => {
    if (!id) {
      return;
    }

    hasAutoSubmitted.current = false;
    hasAttemptedStartRef.current = false;
    setLocalViolationCount(0);

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
    if (!sessionId) {
      return;
    }

    const wasPausedByReload = sessionStorage.getItem(pauseStorageKey) === "1";
    if (wasPausedByReload) {
      setIsPaused(true);
      toast.info("Bài thi đã được tạm dừng sau khi tải lại trang.");
    }
  }, [pauseStorageKey, sessionId]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Đã có kết nối mạng. Bạn có thể tiếp tục làm bài.");
    };

    const handleOffline = () => {
      setIsOffline(true);
      setIsPaused(true);
      toast.warn("Mất kết nối mạng. Bài thi đã tạm dừng.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
    if (!sessionId || isPaused || isOffline || hasAutoSubmitted.current) {
      return;
    }

    void enableFullscreen();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        void reportViolation("TAB_SWITCH");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreenEnabled) {
        void reportViolation("EXIT_FULLSCREEN");
        void enableFullscreen();
      }
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
  }, [
    enableFullscreen,
    isFullscreenEnabled,
    isOffline,
    isPaused,
    reportViolation,
    sessionId,
  ]);

  const handleRetryStartSession = () => {
    if (!id) return;
    hasAttemptedStartRef.current = true;
    void dispatch(
      startExamSession({ examId: id, userId: user?.id, accessCode: null }),
    );
  };

  const handleResumeExam = async () => {
    if (!sessionId || isOffline) {
      toast.warn("Không thể tiếp tục khi đang mất mạng.");
      return;
    }

    setIsPaused(false);
    sessionStorage.removeItem(pauseStorageKey);
    await enableFullscreen();
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

  return (
    <div className="do-exam">
      {(isOffline || isPaused) && (
        <Card>
          <p className="error-text">
            {isOffline
              ? "Mất kết nối mạng. Bài thi đang tạm dừng."
              : "Bài thi đang tạm dừng sau khi reload."}
          </p>
          <div className="do-exam__submit-wrap">
            <Button
              onClick={() => void handleResumeExam()}
              disabled={isOffline}
            >
              Tiếp tục làm bài
            </Button>
          </div>
        </Card>
      )}

      <div className="do-exam__main">
        <div className="do-exam__header">
          <h1 className="do-exam__title">
            {examDetail?.title ?? "Làm bài thi"}
          </h1>
          <ExamTimer
            seconds={remainingTime}
            onTick={(next) => {
              if (!isOffline && !isPaused) {
                dispatch(setRemainingTime(next));
              }
            }}
            onExpire={() => {
              if (!isOffline && !isPaused) {
                void handleSubmit();
              }
            }}
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
                disabled={currentQuestion === 0 || isOffline || isPaused}
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
                  isOffline ||
                  isPaused
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
            if (isOffline || isPaused) {
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
              disabled={isSubmitting || isOffline || isPaused}
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
