import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import FormInput from "../../components/ui/FormInput";
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
import { fetchQuestionBank } from "../../redux/slices/questionSlice";
import type { RootState } from "../../redux/store";
import type { ExamPayload } from "../../types/exam";

const tabs = ["Thông tin đề", "Câu hỏi", "Cấu hình"] as const;
type BuilderTab = (typeof tabs)[number];

type FormValues = Omit<ExamPayload, "questionIds">;

const defaultValues: FormValues = {
  title: "",
  subjectId: 0,
  description: "",
  instructions: "",
  duration: 60,
  passingScore: 50,
  shuffleQuestions: true,
  shuffleAnswers: true,
  accessCode: "",
  status: "Draft",
  maxAttempts: 1,
  showResultAfter: true,
  showCorrectAnswer: false,
  startDate: "",
  endDate: "",
};

const ExamBuilderPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { examDetail, selectedQuestionIds, loading } = useAppSelector(
    (state: RootState) => state.exam,
  );
  const { bank } = useAppSelector((state: RootState) => state.question);

  const [tab, setTab] = useState<BuilderTab>(tabs[0]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues });

  const subjectId = useWatch({ control, name: "subjectId" });

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

    reset({
      title: examDetail.title,
      subjectId: examDetail.subjectId,
      description: examDetail.description ?? "",
      instructions: examDetail.instructions ?? "",
      duration: examDetail.duration,
      passingScore: examDetail.passingScore,
      shuffleQuestions: examDetail.shuffleQuestions,
      shuffleAnswers: examDetail.shuffleAnswers,
      accessCode: examDetail.accessCode ?? "",
      status:
        typeof examDetail.status === "string" ? examDetail.status : "Draft",
      maxAttempts: examDetail.maxAttempts ?? 1,
      showResultAfter: examDetail.showResultAfter ?? true,
      showCorrectAnswer: examDetail.showCorrectAnswer ?? false,
      startDate: examDetail.startDate ?? "",
      endDate: examDetail.endDate ?? "",
    });
  }, [examDetail, isEdit, reset]);

  const selectedQuestions = useMemo(
    () => bank.filter((q) => selectedQuestionIds.includes(q.id)),
    [bank, selectedQuestionIds],
  );

  const availableQuestions = useMemo(
    () => bank.filter((q) => !selectedQuestionIds.includes(q.id)),
    [bank, selectedQuestionIds],
  );

  const onSubmit = handleSubmit(async (values) => {
    if (!values.subjectId) {
      toast.error("Vui lòng chọn môn học");
      return;
    }

    if (selectedQuestionIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 câu hỏi");
      setTab("Câu hỏi");
      return;
    }

    const payload: ExamPayload = {
      ...values,
      questionIds: selectedQuestionIds,
    };

    if (isEdit && id) {
      const result = await dispatch(updateExam({ id, payload }));
      if (updateExam.fulfilled.match(result)) {
        toast.success("Cập nhật đề thi thành công");
        navigate(`/exams/${id}/preview`);
      } else {
        toast.error(result.payload ?? "Không thể cập nhật đề thi");
      }
      return;
    }

    const result = await dispatch(createExam(payload));
    if (createExam.fulfilled.match(result)) {
      toast.success("Tạo đề thi thành công");
      navigate(`/exams/${result.payload.id}/preview`);
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
                registration={register("title", {
                  required: "Tên đề là bắt buộc",
                })}
                error={errors.title}
              />

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.35rem",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  Môn học
                </label>
                <SubjectSelect
                  value={subjectId || undefined}
                  onChange={(value) => setValue("subjectId", value ?? 0)}
                />
              </div>

              <FormInput
                label="Mô tả"
                multiline
                registration={register("description")}
                placeholder="Mô tả ngắn về đề thi"
              />

              <FormInput
                label="Hướng dẫn làm bài"
                multiline
                registration={register("instructions")}
                placeholder="Quy định trước khi thi..."
              />

              <div className="exam-builder__grid">
                <FormInput
                  label="Thời gian (phút)"
                  type="number"
                  min={1}
                  registration={register("duration", {
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
                  registration={register("passingScore", {
                    valueAsNumber: true,
                    min: { value: 0, message: ">= 0" },
                    max: { value: 100, message: "<= 100" },
                  })}
                  error={errors.passingScore}
                />
              </div>
            </div>
          )}

          {tab === "Câu hỏi" && (
            <div className="exam-builder__section">
              <QuestionBank
                leftTitle="Ngân hàng câu hỏi"
                rightTitle="Câu hỏi trong đề"
                available={availableQuestions}
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
                  registration={register("accessCode")}
                />
                <FormInput
                  label="Số lần thi tối đa"
                  type="number"
                  min={0}
                  registration={register("maxAttempts", {
                    valueAsNumber: true,
                  })}
                  hint="0 = không giới hạn"
                />
              </div>

              <div className="exam-builder__grid">
                <FormInput
                  label="Thời gian mở thi"
                  type="datetime-local"
                  registration={register("startDate")}
                />
                <FormInput
                  label="Thời gian đóng thi"
                  type="datetime-local"
                  registration={register("endDate")}
                />
              </div>

              <div className="exam-builder__grid">
                <label className="ui-form-field">
                  <span className="ui-form-field__label">Trạng thái</span>
                  <select
                    className="ui-form-field__control"
                    {...register("status")}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Archived">Archived</option>
                  </select>
                </label>
              </div>

              <div className="exam-builder__grid">
                <label className="ui-form-field">
                  <span className="ui-form-field__label">Trộn câu hỏi</span>
                  <input type="checkbox" {...register("shuffleQuestions")} />
                </label>
                <label className="ui-form-field">
                  <span className="ui-form-field__label">Trộn đáp án</span>
                  <input type="checkbox" {...register("shuffleAnswers")} />
                </label>
                <label className="ui-form-field">
                  <span className="ui-form-field__label">
                    Hiện kết quả sau nộp
                  </span>
                  <input type="checkbox" {...register("showResultAfter")} />
                </label>
                <label className="ui-form-field">
                  <span className="ui-form-field__label">Hiện đáp án đúng</span>
                  <input type="checkbox" {...register("showCorrectAnswer")} />
                </label>
              </div>
            </div>
          )}

          <div className="exam-builder__footer">
            <div style={{ fontSize: "0.82rem", color: "#61728a" }}>
              {selectedQuestionIds.length} câu hỏi đã chọn
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
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
    </div>
  );
};

export default ExamBuilderPage;
