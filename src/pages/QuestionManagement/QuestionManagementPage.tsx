import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { IoAddOutline, IoCreateOutline, IoTrashOutline } from "react-icons/io5";
import { questionService } from "../../api/services/questionService";
import { subjectService } from "../../api/services/subjectService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ConfirmModal from "../../components/ui/ConfirmModal";
import FormInput from "../../components/ui/FormInput";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { useAppSelector } from "../../hooks/reduxHooks";
import type { RootState } from "../../redux/store";
import type { Question, QuestionCreatePayload } from "../../types/question";
import type { Subject } from "../../types/subject";
import { getDifficultyLabel, getQuestionTypeLabel } from "../../utils/examUi";

interface QuestionFormValues {
  subjectId: number;
  content: string;
  explanation: string;
  questionType: number;
  difficultyLevel: number;
  isActive: boolean;
}

interface OptionDraft {
  content: string;
  isCorrect: boolean;
}

const defaultValues: QuestionFormValues = {
  subjectId: 0,
  content: "",
  explanation: "",
  questionType: 0,
  difficultyLevel: 1,
  isActive: true,
};

const QuestionManagementPage = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(
    null,
  );
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [subjectFilter, setSubjectFilter] = useState<number>(0);
  const [keyword, setKeyword] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>([
    { content: "", isCorrect: true },
    { content: "", isCorrect: false },
  ]);

  const {
    register,
    reset,
    watch,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormValues>({ defaultValues });

  const questionType = watch("questionType");

  const loadSubjects = async () => {
    try {
      const result = await subjectService.getSubjects("", 1, 200);
      setSubjects(result.result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tải môn học",
      );
    }
  };

  const loadQuestions = async (subjectId?: number) => {
    setLoading(true);
    try {
      const data = await questionService.getQuestionBank(
        subjectId && subjectId > 0 ? subjectId : undefined,
      );
      setQuestions(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tải ngân hàng câu hỏi",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubjects();
    void loadQuestions();
  }, []);

  useEffect(() => {
    if (questionType === 2) {
      setOptions([
        { content: "Đúng", isCorrect: true },
        { content: "Sai", isCorrect: false },
      ]);
    }
  }, [questionType]);

  const openCreate = () => {
    setEditingQuestionId(null);
    reset({ ...defaultValues, subjectId: subjectFilter || 0 });
    setOptions([
      { content: "", isCorrect: true },
      { content: "", isCorrect: false },
    ]);
    setModalOpen(true);
  };

  const openEdit = (question: Question) => {
    setEditingQuestionId(question.id);
    setValue("subjectId", question.subjectId || subjectFilter || 0);
    setValue("content", question.content || "");
    setValue("explanation", question.explanation || "");
    setValue("questionType", question.questionType ?? 0);
    setValue("difficultyLevel", question.difficultyLevel ?? 1);
    setValue("isActive", question.isActive ?? true);

    const sourceOptions = (question.options ?? [])
      .slice()
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((option) => ({
        content: option.content,
        isCorrect: Boolean(option.isCorrect),
      }));

    setOptions(
      sourceOptions.length >= 2
        ? sourceOptions
        : [
            ...sourceOptions,
            { content: "", isCorrect: sourceOptions.length === 0 },
            { content: "", isCorrect: false },
          ].slice(0, 2),
    );

    setModalOpen(true);
  };

  const addOption = () => {
    if (questionType === 2) return;
    setOptions((prev) => [...prev, { content: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (questionType === 2) return;
    setOptions((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const toggleCorrect = (index: number) => {
    const isMulti = questionType === 1;
    setOptions((prev) =>
      prev.map((option, optionIndex) => ({
        ...option,
        isCorrect: isMulti
          ? optionIndex === index
            ? !option.isCorrect
            : option.isCorrect
          : optionIndex === index,
      })),
    );
  };

  const normalizedRows = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase();
    return questions.filter((question) => {
      if (!lowerKeyword) return true;
      return question.content.toLowerCase().includes(lowerKeyword);
    });
  }, [keyword, questions]);

  const onSubmit = handleSubmit(async (values) => {
    if (!user?.id) {
      toast.error("Không xác định được người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    const finalOptions = options
      .map((option, index) => ({
        ...option,
        orderIndex: index,
        content: option.content.trim(),
      }))
      .filter((option) => option.content.length > 0)
      .map((option, orderIndex) => ({
        content: option.content,
        isCorrect: option.isCorrect,
        orderIndex,
      }));

    if (!values.subjectId) {
      toast.error("Vui lòng chọn môn học");
      return;
    }

    if (!values.content.trim()) {
      toast.error("Nội dung câu hỏi là bắt buộc");
      return;
    }

    if (finalOptions.length < 2) {
      toast.error("Câu hỏi cần tối thiểu 2 đáp án");
      return;
    }

    const correctCount = finalOptions.filter(
      (option) => option.isCorrect,
    ).length;
    if (correctCount === 0) {
      toast.error("Vui lòng chọn đáp án đúng");
      return;
    }

    if (values.questionType !== 1 && correctCount > 1) {
      toast.error("Loại câu hỏi này chỉ cho phép 1 đáp án đúng");
      return;
    }

    const payload: QuestionCreatePayload = {
      subjectId: values.subjectId,
      createdByUserId: user.id,
      content: values.content.trim(),
      explanation: values.explanation?.trim() || null,
      questionType: values.questionType,
      difficultyLevel: values.difficultyLevel,
      isActive: values.isActive,
      tags: null,
      options: finalOptions,
    };

    try {
      if (editingQuestionId) {
        await questionService.updateQuestion(editingQuestionId, payload);
        toast.success("Cập nhật câu hỏi thành công");
      } else {
        await questionService.createQuestion(payload);
        toast.success("Tạo câu hỏi thành công");
      }

      setModalOpen(false);
      await loadQuestions(subjectFilter || undefined);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu câu hỏi",
      );
    }
  });

  const handleDeleteQuestion = async () => {
    if (!deletingQuestion) return;
    try {
      await questionService.deleteQuestion(deletingQuestion.id);
      toast.success("Đã xóa câu hỏi");
      setDeletingQuestion(null);
      await loadQuestions(subjectFilter || undefined);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa câu hỏi",
      );
    }
  };

  return (
    <section className="question-management-page">
      <div className="page-header">
        <div className="page-header__text">
          <h1 className="page-header__title">Quản lý câu hỏi</h1>
          <p className="page-header__subtitle">
            Tạo, chỉnh sửa và xóa câu hỏi trong ngân hàng đề thi.
          </p>
        </div>
      </div>

      <Card>
        <div className="question-management-page__toolbar">
          <label className="ui-form-field">
            <span className="ui-form-field__label">Môn học</span>
            <select
              className="ui-form-field__control"
              value={subjectFilter}
              onChange={(event) => {
                const next = Number(event.target.value);
                setSubjectFilter(next);
                void loadQuestions(next || undefined);
              }}
            >
              <option value={0}>Tất cả môn học</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>

          <label className="ui-form-field question-management-page__search-wrap">
            <span className="ui-form-field__label">Tìm nội dung</span>
            <input
              className="ui-form-field__control"
              placeholder="Nhập từ khóa câu hỏi..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>

          <Button iconLeft={<IoAddOutline />} onClick={openCreate}>
            Thêm câu hỏi
          </Button>
        </div>
      </Card>

      <Card>
        <Table<Question>
          data={normalizedRows}
          rowKey={(row) => row.id}
          emptyText={loading ? "Đang tải dữ liệu..." : "Không có câu hỏi"}
          columns={[
            {
              key: "content",
              title: "Câu hỏi",
              render: (row) => (
                <div className="question-management-page__content-cell">
                  <strong>{row.content}</strong>
                  <p>
                    {getQuestionTypeLabel(row.questionType)} •{" "}
                    {getDifficultyLabel(row.difficultyLevel)}
                  </p>
                </div>
              ),
            },
            {
              key: "options",
              title: "Đáp án",
              render: (row) => {
                const optionsCount = row.options?.length ?? 0;
                const correctCount = (row.options ?? []).filter(
                  (option) => option.isCorrect,
                ).length;
                return `${optionsCount} đáp án / ${correctCount} đúng`;
              },
            },
            {
              key: "isActive",
              title: "Trạng thái",
              render: (row) => (row.isActive === false ? "Ẩn" : "Hiển thị"),
            },
            {
              key: "action",
              title: "Thao tác",
              render: (row) => (
                <div className="question-management-page__actions">
                  <Button
                    size="sm"
                    variant="outline"
                    iconLeft={<IoCreateOutline />}
                    onClick={() => openEdit(row)}
                  >
                    Sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    iconLeft={<IoTrashOutline />}
                    onClick={() => setDeletingQuestion(row)}
                  >
                    Xóa
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={modalOpen}
        size="lg"
        title={editingQuestionId ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
        onClose={() => setModalOpen(false)}
      >
        <form
          className="question-management-page__form"
          onSubmit={(event) => void onSubmit(event)}
        >
          <label className="ui-form-field">
            <span className="ui-form-field__label">Môn học</span>
            <select
              className="ui-form-field__control"
              {...register("subjectId", {
                valueAsNumber: true,
                required: true,
              })}
            >
              <option value={0}>Chọn môn học</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            {errors.subjectId ? (
              <span className="ui-form-field__error">
                Vui lòng chọn môn học
              </span>
            ) : null}
          </label>

          <FormInput
            label="Nội dung câu hỏi"
            multiline
            registration={register("content", { required: true })}
            error={errors.content}
          />

          <div className="question-management-page__grid">
            <label className="ui-form-field">
              <span className="ui-form-field__label">Loại câu hỏi</span>
              <select
                className="ui-form-field__control"
                {...register("questionType", { valueAsNumber: true })}
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
                {...register("difficultyLevel", { valueAsNumber: true })}
              >
                <option value={1}>Dễ</option>
                <option value={2}>Trung bình</option>
                <option value={3}>Khó</option>
              </select>
            </label>
          </div>

          <FormInput
            label="Giải thích đáp án"
            multiline
            registration={register("explanation")}
          />

          <div className="question-management-page__options">
            <div className="question-management-page__options-head">
              <h4>Đáp án</h4>
              {questionType !== 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addOption}
                >
                  Thêm đáp án
                </Button>
              )}
            </div>

            {options.map((option, index) => (
              <div key={index} className="question-management-page__option-row">
                <button
                  type="button"
                  className={`question-management-page__correct-toggle ${option.isCorrect ? "question-management-page__correct-toggle--active" : ""}`.trim()}
                  onClick={() => toggleCorrect(index)}
                >
                  {option.isCorrect ? "Đúng" : "Sai"}
                </button>
                <input
                  className="ui-form-field__control"
                  readOnly={questionType === 2}
                  value={option.content}
                  onChange={(event) =>
                    setOptions((prev) =>
                      prev.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, content: event.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder={`Đáp án ${index + 1}`}
                />
                {questionType !== 2 && options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                  >
                    Xóa
                  </Button>
                )}
              </div>
            ))}
          </div>

          <label className="question-management-page__checkbox">
            <input type="checkbox" {...register("isActive")} />
            Câu hỏi đang hoạt động
          </label>

          <div className="question-management-page__actions question-management-page__actions--form">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit">
              {editingQuestionId ? "Lưu thay đổi" : "Tạo câu hỏi"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deletingQuestion)}
        title="Xóa câu hỏi"
        message="Bạn có chắc muốn xóa câu hỏi này không?"
        onCancel={() => setDeletingQuestion(null)}
        onConfirm={() => void handleDeleteQuestion()}
        confirmLabel="Xóa"
      />
    </section>
  );
};

export default QuestionManagementPage;
