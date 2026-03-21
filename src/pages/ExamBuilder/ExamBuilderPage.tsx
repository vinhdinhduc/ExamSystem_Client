import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  IoAddOutline,
  IoCloudUploadOutline,
  IoDownloadOutline,
  IoFilterOutline,
  IoListOutline,
  IoSaveOutline,
  IoSparklesOutline,
  IoTrashOutline,
} from "react-icons/io5";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import FormInput from "../../components/ui/FormInput";
import Modal from "../../components/ui/Modal";
import SubjectSelect from "../../components/common/SubjectSelect";
import QuestionBank from "../../components/exam/QuestionBank";
import QuestionPreview from "../../components/exam/QuestionPreview";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import {
  createExam,
  fetchExamById,
  setSelectedQuestionIds,
  updateExam,
} from "../../redux/slices/examSlice";
import { examService } from "../../api/services/examService";
import {
  createQuestion,
  fetchQuestionBank,
} from "../../redux/slices/questionSlice";
import type { RootState } from "../../redux/store";
import type {
  ExamDraft,
  ExamPayload,
  ExamAuthoringResult,
  ExamOptionDraft,
  ExamQuestionDraft,
} from "../../types/exam";
import type { QuestionCreatePayload } from "../../types/question";
import { getDifficultyLabel, getQuestionTypeLabel } from "../../utils/examUi";
import Badge from "../../components/ui/Badge";
import { BiCheckCircle, BiQuestionMark, BiTargetLock } from "react-icons/bi";

const tabs = ["Thông tin đề", "Câu hỏi", "Cấu hình"] as const;
type BuilderTab = (typeof tabs)[number];

type FormValues = Omit<ExamPayload, "createdByUserId" | "totalQuestions">;

interface QuestionFormValues {
  content: string;
  explanation: string;
  questionType: number;
  difficultyLevel: number;
}

const defaultValues: FormValues = {
  title: "",
  subjectId: 0,
  description: "",
  instructions: "",
  duration: 60,
  passScore: 50,
  shuffleQuestions: true,
  shuffleAnswers: true,
  accessCode: "",
  status: 0,
  maxAttempts: 1,
  showResultAfter: true,
  showCorrectAnswer: false,
  startDate: "",
  endDate: "",
};

const questionDefaultValues: QuestionFormValues = {
  content: "",
  explanation: "",
  questionType: 0,
  difficultyLevel: 1,
};

const initialOptionDrafts = ["", "", "", ""];

// ── Draft Preview Component ──

const DraftQuestionPreview = ({
  question,
  index,
}: {
  question: ExamQuestionDraft;
  index: number;
}) => (
  <article className="exam-builder__draft-item">
    <div className="exam-builder__draft-item-head">
      <span className="exam-builder__draft-item-index">Câu {index + 1}</span>
      <div className="exam-builder__draft-item-badges">
        <Badge
          label={getQuestionTypeLabel(question.questionType)}
          variant="info"
        />
        <Badge
          label={getDifficultyLabel(question.difficultyLevel)}
          variant="warning"
        />
        <Badge label={`${question.score} điểm`} variant="default" />
      </div>
    </div>
    <p className="exam-builder__draft-item-content">{question.content}</p>
    <ul className="exam-builder__draft-item-options">
      {question.options.map((opt, oi) => (
        <li
          key={oi}
          className={`exam-builder__draft-item-option ${opt.isCorrect ? "exam-builder__draft-item-option--correct" : ""}`}
        >
          {opt.isCorrect ? "✓" : "○"} {opt.content}
        </li>
      ))}
    </ul>
    {question.explanation && (
      <p className="exam-builder__draft-item-explanation">
        {question.explanation}
      </p>
    )}
  </article>
);

// ── Main Component ──

const ExamBuilderPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { examDetail, selectedQuestionIds, loading } = useAppSelector(
    (state: RootState) => state.exam,
  );
  console.log("examDetail", examDetail);
  console.log("selectedQuestionIds", selectedQuestionIds);

  const { bank } = useAppSelector((state: RootState) => state.question);
  const { user } = useAppSelector((state: RootState) => state.auth);
  console.log("Question bank", bank);
  const [tab, setTab] = useState<BuilderTab>(tabs[0]);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "0" | "1" | "2">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<
    "all" | "1" | "2" | "3"
  >("all");
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [optionDrafts, setOptionDrafts] =
    useState<string[]>(initialOptionDrafts);
  const [correctOptionIndexes, setCorrectOptionIndexes] = useState<number[]>(
    [],
  );

  // ── Import & AI state ──
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiQuestionCount, setAiQuestionCount] = useState(10);
  const [aiDifficulty, setAiDifficulty] = useState(1);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [draftResult, setDraftResult] = useState<ExamAuthoringResult | null>(
    null,
  );
  const [draftEditor, setDraftEditor] = useState<ExamDraft | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);

  const {
    register: examRegister,
    handleSubmit: handleExamSubmit,
    setValue: setExamValue,
    reset: resetExam,
    control: examControl,
    getValues: getExamValues,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues });

  const {
    register: questionRegister,
    handleSubmit: handleQuestionSubmit,
    reset: resetQuestion,
    control: questionControl,
  } = useForm<QuestionFormValues>({ defaultValues: questionDefaultValues });

  const subjectId = useWatch({ control: examControl, name: "subjectId" });
  const questionType = useWatch({
    control: questionControl,
    name: "questionType",
  });
  const questionDifficulty = useWatch({
    control: questionControl,
    name: "difficultyLevel",
  });

  useEffect(() => {
    if (id) {
      void dispatch(fetchExamById(id));
    }
    return () => {
      dispatch(setSelectedQuestionIds([]));
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (!subjectId) return;
    void dispatch(fetchQuestionBank(subjectId));
  }, [dispatch, subjectId]);

  useEffect(() => {
    if (!isEdit || !examDetail) return;

    resetExam({
      title: examDetail.title,
      subjectId: examDetail.subjectId,
      description: examDetail.description ?? "",
      instructions: examDetail.instructions ?? "",
      duration: examDetail.duration,
      passScore: examDetail.passScore,
      shuffleQuestions: examDetail.shuffleQuestions,
      shuffleAnswers: examDetail.shuffleAnswers,
      accessCode: examDetail.accessCode ?? "",
      status: examDetail.status,
      maxAttempts: examDetail.maxAttempts,
      showResultAfter: examDetail.showResultAfter,
      showCorrectAnswer: examDetail.showCorrectAnswer,
      startDate: examDetail.startDate ?? "",
      endDate: examDetail.endDate ?? "",
    });
    const detailWithQuestions = examDetail as typeof examDetail & {
      questions?: Array<{ questionId: string }>;
    };
    const existingQuestionIds =
      detailWithQuestions.questions?.map((question) => question.questionId) ??
      [];
    if (existingQuestionIds.length > 0) {
      dispatch(setSelectedQuestionIds(existingQuestionIds));
    }
  }, [dispatch, examDetail, isEdit, resetExam]);

  const selectedQuestions = useMemo(
    () => bank.filter((q) => selectedQuestionIds.includes(q.id)),
    [bank, selectedQuestionIds],
  );

  const availableQuestions = useMemo(
    () => bank.filter((q) => !selectedQuestionIds.includes(q.id)),
    [bank, selectedQuestionIds],
  );

  const filteredAvailableQuestions = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return availableQuestions.filter((question) => {
      const questionTypeValue = String(question.questionType ?? 0);
      const difficultyValue = String(question.difficultyLevel ?? 1);
      const passKeyword =
        !normalizedKeyword ||
        question.content.toLowerCase().includes(normalizedKeyword);
      const passType = typeFilter === "all" || typeFilter === questionTypeValue;
      const passDifficulty =
        difficultyFilter === "all" || difficultyFilter === difficultyValue;

      return passKeyword && passType && passDifficulty;
    });
  }, [availableQuestions, difficultyFilter, keyword, typeFilter]);

  const activeFilterCount =
    Number(typeFilter !== "all") + Number(difficultyFilter !== "all");

  const toggleCorrectOption = (index: number) => {
    const isMultiSelect = questionType === 1;
    if (isMultiSelect) {
      setCorrectOptionIndexes((prev) =>
        prev.includes(index)
          ? prev.filter((item) => item !== index)
          : [...prev, index],
      );
      return;
    }

    setCorrectOptionIndexes([index]);
  };

  const addOptionDraft = () => {
    if (questionType === 2) return;
    setOptionDrafts((prev) => [...prev, ""]);
  };

  const updateOptionDraft = (index: number, value: string) => {
    if (questionType === 2) return;
    setOptionDrafts((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  };

  const removeOptionDraft = (index: number) => {
    if (questionType === 2) return;
    setOptionDrafts((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
    setCorrectOptionIndexes((prev) =>
      prev
        .filter((itemIndex) => itemIndex !== index)
        .map((itemIndex) => (itemIndex > index ? itemIndex - 1 : itemIndex)),
    );
  };

  const resetQuestionComposer = () => {
    resetQuestion(questionDefaultValues);
    setOptionDrafts(initialOptionDrafts);
    setCorrectOptionIndexes([]);
  };

  // ── Import handler ──

  const handleImportSubmit = async () => {
    if (!importFile) {
      toast.error("Vui lòng chọn file để import");
      return;
    }
    if (!subjectId) {
      toast.error("Vui lòng chọn môn học trước");
      setImportModalOpen(false);
      setTab("Thông tin đề");
      return;
    }
    if (!user?.id) {
      toast.error("Không xác định được người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    const formValues = getExamValues();
    setImportLoading(true);
    try {
      const result = await examService.importFromFile({
        subjectId,
        createdByUserId: user.id,
        title: formValues.title || "Đề thi import",
        description: formValues.description || null,
        instructions: formValues.instructions || null,
        duration: formValues.duration,
        passScore: formValues.passScore,
        maxAttempts: formValues.maxAttempts ?? 1,
        shuffleQuestions: formValues.shuffleQuestions,
        shuffleAnswers: formValues.shuffleAnswers,
        showResultAfter: formValues.showResultAfter ?? true,
        showCorrectAnswer: formValues.showCorrectAnswer ?? false,
        status: formValues.status,
        startDate: formValues.startDate || null,
        endDate: formValues.endDate || null,
        accessCode: formValues.accessCode || null,
        file: importFile,
        saveToDatabase: true,
      });
      setDraftResult(result);
      setDraftEditor(null);
      setImportModalOpen(false);
      setImportFile(null);
      setDraftModalOpen(true);
      toast.success(`Import thành công! ${result.totalQuestions} câu hỏi.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Import đề thi thất bại",
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadImportTemplate = async () => {
    setTemplateDownloading(true);
    try {
      const { blob, fileName } = await examService.downloadImportTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success("Đã tải template import");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tải template import",
      );
    } finally {
      setTemplateDownloading(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!subjectId) {
      toast.error("Vui lòng chọn môn học trước");
      setAiModalOpen(false);
      setTab("Thông tin đề");
      return;
    }
    if (!user?.id) {
      toast.error("Không xác định được người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    const formValues = getExamValues();
    setAiLoading(true);
    try {
      const result = await examService.generateWithGemini({
        subjectId,
        createdByUserId: user.id,
        title: formValues.title || "Đề thi AI",
        description: formValues.description || null,
        instructions: formValues.instructions || null,
        questionCount: aiQuestionCount,
        difficultyLevel: aiDifficulty,
        duration: formValues.duration,
        passScore: formValues.passScore,
        maxAttempts: formValues.maxAttempts ?? 1,
        shuffleQuestions: formValues.shuffleQuestions,
        shuffleAnswers: formValues.shuffleAnswers,
        showResultAfter: formValues.showResultAfter ?? true,
        showCorrectAnswer: formValues.showCorrectAnswer ?? false,
        status: formValues.status,
        startDate: formValues.startDate || null,
        endDate: formValues.endDate || null,
        accessCode: formValues.accessCode || null,
        additionalPrompt: aiPrompt || null,
        saveToDatabase: false,
      });

      setDraftResult(result);
      setDraftEditor(result.draft);
      setAiModalOpen(false);
      setAiPrompt("");
      setDraftModalOpen(true);
      toast.success(`AI đã tạo ${result.totalQuestions} câu hỏi!`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Sinh đề bằng AI thất bại",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const resetDraftState = () => {
    setDraftModalOpen(false);
    setDraftResult(null);
    setDraftEditor(null);
    setDraftSaving(false);
  };

  const addDraftQuestion = () => {
    setDraftEditor((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: [
          ...prev.questions,
          {
            content: "",
            explanation: "",
            questionType: 0,
            difficultyLevel: 1,
            score: 1,
            orderIndex: prev.questions.length + 1,
            options: [
              { content: "", isCorrect: true, orderIndex: 0, imageUrl: null },
              {
                content: "",
                isCorrect: false,
                orderIndex: 1,
                imageUrl: null,
              },
            ],
          },
        ],
      };
    });
  };

  const removeDraftQuestion = (questionIndex: number) => {
    setDraftEditor((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions
          .filter((_, index) => index !== questionIndex)
          .map((question, index) => ({ ...question, orderIndex: index + 1 })),
      };
    });
  };

  const updateDraftQuestion = (
    questionIndex: number,
    updater: (question: ExamQuestionDraft) => ExamQuestionDraft,
  ) => {
    setDraftEditor((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map((question, index) =>
          index === questionIndex ? updater(question) : question,
        ),
      };
    });
  };

  const setDraftQuestionType = (
    questionIndex: number,
    questionType: number,
  ) => {
    updateDraftQuestion(questionIndex, (question) => {
      if (questionType === 2) {
        return {
          ...question,
          questionType,
          options: [
            { content: "Đúng", isCorrect: true, orderIndex: 0, imageUrl: null },
            {
              content: "Sai",
              isCorrect: false,
              orderIndex: 1,
              imageUrl: null,
            },
          ],
        };
      }

      const normalizedOptions =
        question.options.length >= 2
          ? question.options
          : [
              ...question.options,
              {
                content: "",
                isCorrect: false,
                orderIndex: question.options.length,
                imageUrl: null,
              },
            ];

      return {
        ...question,
        questionType,
        options: normalizedOptions.map((option, optionIndex) => ({
          ...option,
          orderIndex: optionIndex,
          isCorrect:
            questionType !== 1 && optionIndex > 0
              ? false
              : Boolean(option.isCorrect),
        })),
      };
    });
  };

  const toggleDraftCorrectOption = (
    questionIndex: number,
    optionIndex: number,
  ) => {
    updateDraftQuestion(questionIndex, (question) => {
      const isMultipleChoice = question.questionType === 1;
      return {
        ...question,
        options: question.options.map((option, index) => ({
          ...option,
          isCorrect: isMultipleChoice
            ? index === optionIndex
              ? !option.isCorrect
              : option.isCorrect
            : index === optionIndex,
        })),
      };
    });
  };

  const addDraftOption = (questionIndex: number) => {
    updateDraftQuestion(questionIndex, (question) => {
      if (question.questionType === 2) return question;
      return {
        ...question,
        options: [
          ...question.options,
          {
            content: "",
            isCorrect: false,
            orderIndex: question.options.length,
            imageUrl: null,
          },
        ],
      };
    });
  };

  const removeDraftOption = (questionIndex: number, optionIndex: number) => {
    updateDraftQuestion(questionIndex, (question) => {
      if (question.questionType === 2) return question;
      const remaining = question.options
        .filter((_, index) => index !== optionIndex)
        .map((option, index) => ({ ...option, orderIndex: index }));

      if (remaining.length === 0) {
        return {
          ...question,
          options: [
            { content: "", isCorrect: true, orderIndex: 0, imageUrl: null },
            {
              content: "",
              isCorrect: false,
              orderIndex: 1,
              imageUrl: null,
            },
          ],
        };
      }

      return {
        ...question,
        options: remaining,
      };
    });
  };

  const normalizeDraftForSave = (draft: ExamDraft): ExamDraft => ({
    ...draft,
    title: draft.title.trim(),
    description: draft.description?.trim() || null,
    instructions: draft.instructions?.trim() || null,
    questions: draft.questions.map((question, questionIndex) => {
      const normalizedOptions: ExamOptionDraft[] = question.options
        .map((option, optionIndex) => ({
          content: option.content.trim(),
          isCorrect: Boolean(option.isCorrect),
          orderIndex: optionIndex,
          imageUrl: option.imageUrl ?? null,
        }))
        .filter((option) => option.content.length > 0);

      return {
        ...question,
        content: question.content.trim(),
        explanation: question.explanation?.trim() || null,
        orderIndex: questionIndex + 1,
        options: normalizedOptions,
      };
    }),
  });

  const saveEditedDraft = async () => {
    if (!draftEditor || !subjectId || !user?.id) {
      toast.error("Thiếu dữ liệu để lưu đề từ nháp AI");
      return;
    }

    const normalizedDraft = normalizeDraftForSave(draftEditor);

    if (!normalizedDraft.title) {
      toast.error("Vui lòng nhập tiêu đề đề thi");
      return;
    }

    if (normalizedDraft.questions.length === 0) {
      toast.error("Nháp đề cần ít nhất 1 câu hỏi");
      return;
    }

    const hasInvalidQuestion = normalizedDraft.questions.some((question) => {
      if (!question.content.trim()) return true;
      if (question.options.length < 2) return true;
      const correctCount = question.options.filter(
        (option) => option.isCorrect,
      ).length;
      if (correctCount === 0) return true;
      if (question.questionType !== 1 && correctCount > 1) return true;
      return false;
    });

    if (hasInvalidQuestion) {
      toast.error(
        "Vui lòng kiểm tra lại nội dung câu hỏi và đáp án đúng trong bản nháp",
      );
      return;
    }

    setDraftSaving(true);
    try {
      const saved = await examService.saveDraft({
        subjectId,
        createdByUserId: user.id,
        source: "gemini-edited",
        draft: normalizedDraft,
      });

      if (!saved.examId) {
        toast.error("Lưu đề thi thất bại: không nhận được examId");
        return;
      }

      toast.success("Đã lưu đề thi từ bản nháp AI");
      resetDraftState();
      navigate(`/exams/${saved.examId}/preview`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu đề từ bản nháp",
      );
    } finally {
      setDraftSaving(false);
    }
  };

  const onCreateQuestion = handleQuestionSubmit(async (values) => {
    if (!subjectId) {
      toast.error("Vui lòng chọn môn học trước khi tạo câu hỏi");
      setTab("Thông tin đề");
      return;
    }

    if (!user?.id) {
      toast.error(
        "Không xác định được người tạo câu hỏi. Vui lòng đăng nhập lại.",
      );
      return;
    }

    const optionSource = questionType === 2 ? ["Đúng", "Sai"] : optionDrafts;
    const normalizedCorrectIndexes =
      questionType === 2 && correctOptionIndexes.length !== 1
        ? [0]
        : correctOptionIndexes;

    const finalOptions = optionSource
      .map((content, index) => ({ content: content.trim(), index }))
      .filter((option) => option.content.length > 0)
      .map((option, orderIndex) => ({
        content: option.content,
        isCorrect: normalizedCorrectIndexes.includes(option.index),
        orderIndex,
      }));

    if (finalOptions.length < 2) {
      toast.error("Câu hỏi cần tối thiểu 2 đáp án");
      return;
    }

    const correctCount = finalOptions.filter(
      (option) => option.isCorrect,
    ).length;
    if (correctCount === 0) {
      toast.error("Vui lòng chọn ít nhất 1 đáp án đúng");
      return;
    }

    if (values.questionType !== 1 && correctCount > 1) {
      toast.error("Loại câu hỏi này chỉ cho phép 1 đáp án đúng");
      return;
    }

    const payload: QuestionCreatePayload = {
      subjectId,
      createdByUserId: user.id,
      content: values.content.trim(),
      explanation: values.explanation?.trim() || null,
      questionType: values.questionType,
      difficultyLevel: values.difficultyLevel,
      tags: null,
      isActive: true,
      options: finalOptions,
    };

    const result = await dispatch(createQuestion(payload));
    if (createQuestion.fulfilled.match(result)) {
      toast.success("Đã tạo câu hỏi mới");
      dispatch(
        setSelectedQuestionIds([...selectedQuestionIds, result.payload.id]),
      );
      resetQuestionComposer();
      setQuestionModalOpen(false);
      void dispatch(fetchQuestionBank(subjectId));
      return;
    }

    toast.error(result.payload ?? "Không thể tạo câu hỏi");
  });

  const onSubmit = handleExamSubmit(async (values) => {
    if (!values.subjectId) {
      toast.error("Vui lòng chọn môn học");
      return;
    }

    if (
      values.startDate &&
      values.endDate &&
      new Date(values.endDate).getTime() <= new Date(values.startDate).getTime()
    ) {
      toast.error("Thời gian đóng thi phải sau thời gian mở thi");
      setTab("Cấu hình");
      return;
    }

    if (selectedQuestionIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 câu hỏi");
      setTab("Câu hỏi");
      return;
    }

    if (!user?.id) {
      toast.error(
        "Không xác định được người tạo đề thi. Vui lòng đăng nhập lại.",
      );
      return;
    }

    const payload: ExamPayload = {
      ...values,
      createdByUserId: user.id,
      accessCode: values.accessCode?.trim() ? values.accessCode.trim() : null,
      totalQuestions: selectedQuestionIds.length,
    };

    const examQuestionItems = selectedQuestionIds.map(
      (questionId, orderIndex) => ({
        questionId,
        orderIndex: orderIndex + 1,
        score: 1,
      }),
    );

    if (isEdit && id) {
      const result = await dispatch(updateExam({ id, payload }));
      if (updateExam.fulfilled.match(result)) {
        try {
          await examService.syncExamQuestions(id, examQuestionItems);
          toast.success("Cập nhật đề thi thành công");
          navigate(`/exams/${id}/preview`);
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Đã lưu đề thi nhưng không thể cập nhật danh sách câu hỏi",
          );
        }
      } else {
        toast.error(result.payload ?? "Không thể cập nhật đề thi");
      }
      return;
    }

    const result = await dispatch(createExam(payload));
    if (createExam.fulfilled.match(result)) {
      try {
        await examService.saveExamQuestions(
          result.payload.id,
          examQuestionItems,
        );
        toast.success("Tạo đề thi thành công");
        navigate(`/exams/${result.payload.id}/preview`);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Đã tạo đề thi nhưng không thể lưu câu hỏi",
        );
      }
    } else {
      toast.error(result.payload ?? "Không thể tạo đề thi");
    }
  });

  return (
    <div className="exam-builder">
      <div className="page-header">
        <div className="page-header__text">
          <h1 className="page-header__title">
            {isEdit ? "Chỉnh sửa đề thi" : "Tạo đề thi mới"}
          </h1>
          <p className="page-header__subtitle">
            Cấu hình thông tin đề, chọn câu hỏi và thiết lập thi.
          </p>
        </div>
      </div>

      <Card>
        <div className="exam-builder__tabs">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              className={`exam-builder__tab ${tab === item ? "exam-builder__tab--active" : ""}`.trim()}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <form onSubmit={(event) => void onSubmit(event)}>
          {tab === "Thông tin đề" && (
            <div className="exam-builder__section">
              <FormInput
                label="Tên đề thi"
                placeholder="VD: Kiểm tra giữa kỳ CSDL"
                registration={examRegister("title", {
                  required: "Tên đề là bắt buộc",
                })}
                error={errors.title}
              />

              <div>
                <label className="exam-builder__label">Môn học</label>
                <SubjectSelect
                  value={subjectId || undefined}
                  onChange={(value) => setExamValue("subjectId", value ?? 0)}
                />
              </div>

              <FormInput
                label="Mô tả"
                multiline
                registration={examRegister("description")}
                placeholder="Mô tả ngắn về đề thi"
              />

              <FormInput
                label="Hướng dẫn làm bài"
                multiline
                registration={examRegister("instructions")}
                placeholder="Quy định trước khi thi..."
              />

              <div className="exam-builder__grid">
                <FormInput
                  label="Thời gian (phút)"
                  type="number"
                  min={1}
                  registration={examRegister("duration", {
                    valueAsNumber: true,
                    min: { value: 1, message: "Thời gian phải > 0" },
                  })}
                  error={errors.duration}
                />
                <FormInput
                  label="Điểm đạt (%)"
                  type="number"
                  min={0}
                  max={100}
                  registration={examRegister("passScore", {
                    valueAsNumber: true,
                    min: { value: 0, message: ">= 0" },
                    max: { value: 100, message: "<= 100" },
                  })}
                  error={errors.passScore}
                />
              </div>
            </div>
          )}

          {tab === "Câu hỏi" && (
            <div className="exam-builder__section">
              <Card
                title="Ngân hàng câu hỏi"
                subtitle="Lọc nhanh, thêm câu hỏi mới và kéo-thả vào đề"
                actions={
                  <div className="exam-builder__import-ai-actions">
                    <Button
                      type="button"
                      variant="outline"
                      iconLeft={<IoAddOutline />}
                      onClick={() => {
                        if (!subjectId) {
                          toast.info("Vui lòng chọn môn học trước");
                          setTab("Thông tin đề");
                          return;
                        }
                        setQuestionModalOpen(true);
                      }}
                    >
                      Tạo câu hỏi
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      iconLeft={<IoCloudUploadOutline />}
                      onClick={() => {
                        if (!subjectId) {
                          toast.info("Vui lòng chọn môn học trước");
                          setTab("Thông tin đề");
                          return;
                        }
                        setImportModalOpen(true);
                      }}
                    >
                      Import file
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      iconLeft={<IoSparklesOutline />}
                      onClick={() => {
                        if (!subjectId) {
                          toast.info("Vui lòng chọn môn học trước");
                          setTab("Thông tin đề");
                          return;
                        }
                        setAiModalOpen(true);
                      }}
                    >
                      Sinh đề AI
                    </Button>
                  </div>
                }
              >
                <div className="exam-builder__bank-tools">
                  <label className="ui-form-field exam-builder__search-wrap">
                    <span className="ui-form-field__label">Tìm câu hỏi</span>
                    <input
                      className="ui-form-field__control"
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="Tìm theo nội dung câu hỏi..."
                    />
                  </label>
                  <label className="ui-form-field">
                    <span className="ui-form-field__label">Loại câu hỏi</span>
                    <select
                      className="ui-form-field__control"
                      value={typeFilter}
                      onChange={(event) =>
                        setTypeFilter(event.target.value as typeof typeFilter)
                      }
                    >
                      <option value="all">Tất cả</option>
                      <option value="0">Một đáp án</option>
                      <option value="1">Nhiều đáp án</option>
                      <option value="2">Đúng / Sai</option>
                    </select>
                  </label>
                  <label className="ui-form-field">
                    <span className="ui-form-field__label">Độ khó</span>
                    <select
                      className="ui-form-field__control"
                      value={difficultyFilter}
                      onChange={(event) =>
                        setDifficultyFilter(
                          event.target.value as typeof difficultyFilter,
                        )
                      }
                    >
                      <option value="all">Tất cả</option>
                      <option value="1">Dễ</option>
                      <option value="2">Trung bình</option>
                      <option value="3">Khó</option>
                    </select>
                  </label>
                </div>
                <div className="exam-builder__bank-stats">
                  <span>
                    <IoListOutline /> {bank.length} câu trong ngân hàng
                  </span>
                  <span>
                    <IoSparklesOutline /> {selectedQuestionIds.length} câu đã
                    chọn
                  </span>
                  <span>
                    <IoFilterOutline /> {activeFilterCount} bộ lọc đang bật
                  </span>
                </div>
              </Card>

              <QuestionBank
                leftTitle="Ngân hàng câu hỏi"
                rightTitle="Câu hỏi trong đề"
                available={filteredAvailableQuestions}
                selected={selectedQuestions}
                onChange={(ids) => dispatch(setSelectedQuestionIds(ids))}
              />

              {selectedQuestions.length > 0 && (
                <Card title="Preview câu hỏi đã chọn">
                  {selectedQuestions.map((question, index) => (
                    <QuestionPreview
                      key={question.id}
                      question={question}
                      index={index}
                    />
                  ))}
                </Card>
              )}
            </div>
          )}

          {tab === "Cấu hình" && (
            <div className="exam-builder__section">
              <div className="exam-builder__grid">
                <FormInput
                  label="Mã truy cập (tuỳ chọn)"
                  placeholder="VD: MIDTERM-01"
                  registration={examRegister("accessCode")}
                />
                <FormInput
                  label="Số lần thi tối đa"
                  type="number"
                  min={0}
                  registration={examRegister("maxAttempts", {
                    valueAsNumber: true,
                  })}
                  hint="0 = không giới hạn"
                />
              </div>

              <div className="exam-builder__grid">
                <FormInput
                  label="Thời gian mở thi"
                  type="datetime-local"
                  registration={examRegister("startDate")}
                />
                <FormInput
                  label="Thời gian đóng thi"
                  type="datetime-local"
                  registration={examRegister("endDate")}
                />
              </div>

              <div className="exam-builder__grid">
                <label className="ui-form-field">
                  <span className="ui-form-field__label">Trạng thái</span>
                  <select
                    className="ui-form-field__control"
                    {...examRegister("status", { valueAsNumber: true })}
                  >
                    <option value={0}>Nháp</option>
                    <option value={1}>Đã xuất bản</option>
                    <option value={2}>Lưu trữ</option>
                  </select>
                </label>
              </div>

              <div className="exam-builder__grid">
                <label className="ui-form-field">
                  <span className="ui-form-field__label">Trộn câu hỏi</span>
                  <input
                    type="checkbox"
                    {...examRegister("shuffleQuestions")}
                  />
                </label>
                <label className="ui-form-field">
                  <span className="ui-form-field__label">Trộn đáp án</span>
                  <input type="checkbox" {...examRegister("shuffleAnswers")} />
                </label>
                <label className="ui-form-field">
                  <span className="ui-form-field__label">
                    Hiện kết quả sau nộp
                  </span>
                  <input type="checkbox" {...examRegister("showResultAfter")} />
                </label>
                <label className="ui-form-field">
                  <span className="ui-form-field__label">Hiện đáp án đúng</span>
                  <input
                    type="checkbox"
                    {...examRegister("showCorrectAnswer")}
                  />
                </label>
              </div>
            </div>
          )}

          <div className="exam-builder__footer">
            <div className="exam-builder__selected-count">
              {selectedQuestionIds.length} câu hỏi đã chọn
            </div>
            <div className="exam-builder__footer-actions">
              {tab !== tabs[0] && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setTab(tabs[Math.max(0, tabs.indexOf(tab) - 1)])
                  }
                >
                  Quay lại
                </Button>
              )}
              {tab !== tabs[tabs.length - 1] ? (
                <Button
                  type="button"
                  onClick={() =>
                    setTab(
                      tabs[Math.min(tabs.length - 1, tabs.indexOf(tab) + 1)],
                    )
                  }
                >
                  Tiếp theo
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading
                    ? "Đang lưu..."
                    : isEdit
                      ? "Cập nhật đề thi"
                      : "Tạo đề thi"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* ── Question Creation Modal ── */}
      <Modal
        open={questionModalOpen}
        title="Tạo câu hỏi trắc nghiệm"
        description="Câu hỏi mới sẽ được thêm vào ngân hàng và tự động đưa vào đề thi hiện tại."
        size="lg"
        onClose={() => {
          setQuestionModalOpen(false);
          resetQuestionComposer();
        }}
      >
        <form
          className="exam-builder__question-form"
          onSubmit={(event) => void onCreateQuestion(event)}
        >
          <FormInput
            label="Nội dung câu hỏi"
            multiline
            placeholder="Nhập câu hỏi..."
            registration={questionRegister("content", {
              required: "Nội dung câu hỏi là bắt buộc",
            })}
          />

          <div className="exam-builder__grid">
            <label className="ui-form-field">
              <span className="ui-form-field__label">Loại câu hỏi</span>
              <select
                className="ui-form-field__control"
                {...questionRegister("questionType", { valueAsNumber: true })}
              >
                <option value={0}>Một đáp án</option>
                <option value={1}>Nhiều đáp án</option>
                <option value={2}>Đúng / Sai</option>
              </select>
            </label>

            <label className="ui-form-field">
              <span className="ui-form-field__label">Độ khó</span>
              <select
                className="ui-form-field__control"
                {...questionRegister("difficultyLevel", {
                  valueAsNumber: true,
                })}
              >
                <option value={1}>Dễ</option>
                <option value={2}>Trung bình</option>
                <option value={3}>Khó</option>
              </select>
            </label>
          </div>

          <FormInput
            label="Giải thích đáp án (tuỳ chọn)"
            multiline
            placeholder="Giải thích ngắn gọn vì sao đáp án đúng"
            registration={questionRegister("explanation")}
          />

          <div className="exam-builder__question-options">
            <div className="exam-builder__question-options-head">
              <h4>Đáp án</h4>
              {questionType !== 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={addOptionDraft}
                  iconLeft={<IoAddOutline />}
                >
                  Thêm đáp án
                </Button>
              )}
            </div>
            {(questionType === 2 ? ["Đúng", "Sai"] : optionDrafts).map(
              (option, index) => {
                const checked = correctOptionIndexes.includes(index);

                return (
                  <div
                    key={`option-${index}`}
                    className="exam-builder__option-row"
                  >
                    <button
                      type="button"
                      className={`exam-builder__correct-toggle ${checked ? "exam-builder__correct-toggle--active" : ""}`.trim()}
                      onClick={() => toggleCorrectOption(index)}
                      title="Đánh dấu đáp án đúng"
                    >
                      {checked ? "Đúng" : "Sai"}
                    </button>
                    <input
                      className="ui-form-field__control"
                      value={option}
                      readOnly={questionType === 2}
                      onChange={(event) =>
                        updateOptionDraft(index, event.target.value)
                      }
                      placeholder={`Đáp án ${index + 1}`}
                    />
                    {questionType !== 2 && optionDrafts.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeOptionDraft(index)}
                      >
                        Xóa
                      </Button>
                    )}
                  </div>
                );
              },
            )}
          </div>

          <div className="exam-builder__question-hint">
            <span>
              Loại câu: <strong>{getQuestionTypeLabel(questionType)}</strong>
            </span>
            <span>
              Độ khó: <strong>{getDifficultyLabel(questionDifficulty)}</strong>
            </span>
          </div>

          <div className="exam-builder__footer-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuestionModalOpen(false);
                resetQuestionComposer();
              }}
            >
              Hủy
            </Button>
            <Button type="submit">Tạo và thêm vào đề</Button>
          </div>
        </form>
      </Modal>

      {/* ── Import from File Modal ── */}
      <Modal
        open={importModalOpen}
        title="Import đề thi từ file"
        description="Tải lên file (.docx, .xlsx, .pdf) chứa câu hỏi trắc nghiệm. Hệ thống sẽ tự động phân tích và tạo đề thi."
        size="lg"
        onClose={() => {
          setImportModalOpen(false);
          setImportFile(null);
        }}
      >
        <div className="exam-builder__import-modal">
          <div className="exam-builder__footer-actions">
            <Button
              type="button"
              variant="outline"
              iconLeft={<IoDownloadOutline />}
              disabled={templateDownloading}
              onClick={() => void handleDownloadImportTemplate()}
            >
              {templateDownloading
                ? "Đang tải template..."
                : "Tải template import"}
            </Button>
          </div>

          <div
            className={`exam-builder__file-upload ${importFile ? "exam-builder__file-upload--has-file" : ""}`}
          >
            <IoCloudUploadOutline className="exam-builder__file-upload-icon" />
            <p className="exam-builder__file-upload-text">
              {importFile
                ? importFile.name
                : "Kéo thả file vào đây hoặc click để chọn"}
            </p>
            <p className="exam-builder__file-upload-hint">
              Hỗ trợ: .docx, .xlsx, .pdf (tối đa 10MB)
            </p>
            <input
              type="file"
              className="exam-builder__file-upload-input"
              accept=".docx,.xlsx,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImportFile(file);
              }}
            />
          </div>

          {importFile && (
            <div className="exam-builder__file-info">
              <span className="exam-builder__file-info-name">
                📄 {importFile.name}
              </span>
              <span className="exam-builder__file-info-size">
                {(importFile.size / 1024).toFixed(1)} KB
              </span>
              <button
                type="button"
                className="exam-builder__file-info-remove"
                onClick={() => setImportFile(null)}
              >
                Xóa
              </button>
            </div>
          )}

          <div className="exam-builder__footer-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setImportModalOpen(false);
                setImportFile(null);
              }}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={!importFile || importLoading}
              onClick={() => void handleImportSubmit()}
            >
              {importLoading ? "Đang xử lý..." : "Import đề thi"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── AI Generation Modal ── */}
      <Modal
        open={aiModalOpen}
        title="Sinh đề thi bằng AI"
        description="AI sẽ tự động tạo câu hỏi trắc nghiệm dựa trên môn học và cấu hình bạn chọn."
        size="lg"
        onClose={() => {
          setAiModalOpen(false);
          setAiPrompt("");
        }}
      >
        <div className="exam-builder__ai-modal">
          <div className="exam-builder__grid">
            <label className="ui-form-field">
              <span className="ui-form-field__label">Số lượng câu hỏi</span>
              <input
                className="ui-form-field__control"
                type="number"
                min={1}
                max={100}
                value={aiQuestionCount}
                onChange={(e) => setAiQuestionCount(Number(e.target.value))}
              />
            </label>
            <label className="ui-form-field">
              <span className="ui-form-field__label">Độ khó</span>
              <select
                className="ui-form-field__control"
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(Number(e.target.value))}
              >
                <option value={1}>Dễ</option>
                <option value={2}>Trung bình</option>
                <option value={3}>Khó</option>
              </select>
            </label>
          </div>

          <label className="ui-form-field">
            <span className="ui-form-field__label">
              Yêu cầu bổ sung cho AI (tuỳ chọn)
            </span>
            <textarea
              className="ui-form-field__control"
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="VD: Tập trung vào chương 3, câu hỏi ứng dụng thực tế, tránh câu hỏi quá dễ..."
            />
          </label>

          <div className="exam-builder__ai-info">
            <IoSparklesOutline />
            <span>
              AI sẽ sinh <strong>{aiQuestionCount}</strong> câu hỏi{" "}
              <strong>{getDifficultyLabel(aiDifficulty)}</strong> cho môn học đã
              chọn.
            </span>
          </div>

          <div className="exam-builder__footer-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAiModalOpen(false);
                setAiPrompt("");
              }}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={aiLoading}
              onClick={() => void handleAiGenerate()}
            >
              {aiLoading ? "Đang sinh đề..." : "Sinh đề thi"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Draft Preview Modal ── */}
      <Modal
        open={draftModalOpen}
        title={`Kết quả ${draftResult?.source === "gemini" ? "sinh đề AI" : "import file"}`}
        description={`${draftResult?.totalQuestions ?? 0} câu hỏi đã được tạo. Bạn có thể chỉnh sửa trước khi lưu đề thi.`}
        size="lg"
        onClose={resetDraftState}
      >
        <div className="exam-builder__draft-preview">
          {draftResult && !draftEditor && (
            <>
              <div className="exam-builder__draft-stats">
                <span className="exam-builder__draft-stat">
                  <BiQuestionMark /> {draftResult.totalQuestions} câu hỏi
                </span>
                <span className="exam-builder__draft-stat">
                  <BiTargetLock /> Nguồn:{" "}
                  {draftResult.source === "gemini"
                    ? "AI Gemini"
                    : "File import"}
                </span>
                {draftResult.examId && (
                  <span className="exam-builder__draft-stat">
                    <BiCheckCircle /> Đã lưu vào hệ thống
                  </span>
                )}
              </div>

              <div className="exam-builder__draft-list">
                {draftResult.draft.questions.map((question, index) => (
                  <DraftQuestionPreview
                    key={index}
                    question={question}
                    index={index}
                  />
                ))}
              </div>
            </>
          )}

          {draftEditor && (
            <div className="exam-builder__draft-editor">
              <div className="exam-builder__draft-editor-meta">
                <FormInput
                  label="Tên đề thi"
                  value={draftEditor.title}
                  onChange={(event: unknown) => {
                    const nextValue = (event as ChangeEvent<HTMLInputElement>)
                      .target.value;
                    setDraftEditor((prev) =>
                      prev ? { ...prev, title: nextValue } : prev,
                    );
                  }}
                />

                <div className="exam-builder__grid">
                  <FormInput
                    label="Thời gian (phút)"
                    type="number"
                    min={1}
                    value={draftEditor.duration}
                    onChange={(event: unknown) => {
                      const nextValue = Number(
                        (event as ChangeEvent<HTMLInputElement>).target.value,
                      );
                      setDraftEditor((prev) =>
                        prev
                          ? {
                              ...prev,
                              duration: Math.max(1, nextValue),
                            }
                          : prev,
                      );
                    }}
                  />
                  <FormInput
                    label="Điểm đạt (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={draftEditor.passScore}
                    onChange={(event: unknown) => {
                      const nextValue = Number(
                        (event as ChangeEvent<HTMLInputElement>).target.value,
                      );
                      setDraftEditor((prev) =>
                        prev
                          ? {
                              ...prev,
                              passScore: Math.max(0, nextValue),
                            }
                          : prev,
                      );
                    }}
                  />
                </div>
              </div>

              <div className="exam-builder__draft-editor-tools">
                <Button
                  type="button"
                  variant="outline"
                  iconLeft={<IoAddOutline />}
                  onClick={addDraftQuestion}
                >
                  Thêm câu hỏi
                </Button>
              </div>

              <div className="exam-builder__draft-list">
                {draftEditor.questions.map((question, questionIndex) => (
                  <article
                    key={questionIndex}
                    className="exam-builder__draft-edit-item"
                  >
                    <div className="exam-builder__draft-edit-head">
                      <strong>Câu {questionIndex + 1}</strong>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        iconLeft={<IoTrashOutline />}
                        onClick={() => removeDraftQuestion(questionIndex)}
                      >
                        Xóa câu
                      </Button>
                    </div>

                    <FormInput
                      label="Nội dung câu hỏi"
                      multiline
                      value={question.content}
                      onChange={(event: { target: { value: string } }) => {
                        const nextValue = event.target.value;
                        updateDraftQuestion(questionIndex, (current) => ({
                          ...current,
                          content: nextValue,
                        }));
                      }}
                    />

                    <div className="exam-builder__grid">
                      <label className="ui-form-field">
                        <span className="ui-form-field__label">
                          Loại câu hỏi
                        </span>
                        <select
                          className="ui-form-field__control"
                          value={question.questionType}
                          onChange={(event: unknown) => {
                            const nextValue = Number(
                              (event as ChangeEvent<HTMLSelectElement>).target
                                .value,
                            );
                            setDraftQuestionType(questionIndex, nextValue);
                          }}
                        >
                          <option value={0}>Một đáp án</option>
                          <option value={1}>Nhiều đáp án</option>
                          <option value={2}>Đúng / Sai</option>
                        </select>
                      </label>
                      <label className="ui-form-field">
                        <span className="ui-form-field__label">Độ khó</span>
                        <select
                          className="ui-form-field__control"
                          value={question.difficultyLevel}
                          onChange={(event: unknown) => {
                            const nextValue = Number(
                              (event as ChangeEvent<HTMLSelectElement>).target
                                .value,
                            );
                            updateDraftQuestion(questionIndex, (current) => ({
                              ...current,
                              difficultyLevel: nextValue,
                            }));
                          }}
                        >
                          <option value={1}>Dễ</option>
                          <option value={2}>Trung bình</option>
                          <option value={3}>Khó</option>
                        </select>
                      </label>
                    </div>

                    <div className="exam-builder__draft-options">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="exam-builder__option-row"
                        >
                          <button
                            type="button"
                            className={`exam-builder__correct-toggle ${option.isCorrect ? "exam-builder__correct-toggle--active" : ""}`.trim()}
                            onClick={() =>
                              toggleDraftCorrectOption(
                                questionIndex,
                                optionIndex,
                              )
                            }
                          >
                            {option.isCorrect ? "Đúng" : "Sai"}
                          </button>
                          <input
                            className="ui-form-field__control"
                            value={option.content}
                            readOnly={question.questionType === 2}
                            onChange={(event: unknown) => {
                              const nextValue = (
                                event as ChangeEvent<HTMLInputElement>
                              ).target.value;
                              updateDraftQuestion(questionIndex, (current) => ({
                                ...current,
                                options: current.options.map((item, index) =>
                                  index === optionIndex
                                    ? { ...item, content: nextValue }
                                    : item,
                                ),
                              }));
                            }}
                            placeholder={`Đáp án ${optionIndex + 1}`}
                          />
                          {question.questionType !== 2 &&
                            question.options.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                  removeDraftOption(questionIndex, optionIndex)
                                }
                              >
                                Xóa
                              </Button>
                            )}
                        </div>
                      ))}
                    </div>

                    {question.questionType !== 2 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        iconLeft={<IoAddOutline />}
                        onClick={() => addDraftOption(questionIndex)}
                      >
                        Thêm đáp án
                      </Button>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="exam-builder__footer-actions">
            <Button type="button" variant="outline" onClick={resetDraftState}>
              Hủy
            </Button>
            {draftEditor ? (
              <Button
                type="button"
                iconLeft={<IoSaveOutline />}
                disabled={draftSaving}
                onClick={() => void saveEditedDraft()}
              >
                {draftSaving ? "Đang lưu..." : "Lưu đề thi"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  if (draftResult?.examId) {
                    navigate(`/exams/${draftResult.examId}/preview`);
                    return;
                  }
                  resetDraftState();
                }}
              >
                {draftResult?.examId ? "Xem đề thi" : "Đóng"}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExamBuilderPage;
