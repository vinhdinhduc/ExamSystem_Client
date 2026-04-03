import type { Question } from "../../types/question";
import { IoCheckmarkCircle } from "react-icons/io5";
import Badge from "../ui/Badge";
import {
  getDifficultyLabel,
  getQuestionOptions,
  getQuestionTypeLabel,
} from "../../utils/examUi";
import KaTeXRenderer from "../math/KaTeXRenderer";

interface QuestionPreviewProps {
  question: Question;
  index: number;
}

const QuestionPreview = ({ question, index }: QuestionPreviewProps) => {
  const options = getQuestionOptions(question);

  return (
    <article className="question-preview">
      <div className="question-preview__badges">
        <Badge
          label={getQuestionTypeLabel(question.questionType)}
          variant="info"
        />
        <Badge
          label={getDifficultyLabel(question.difficultyLevel)}
          variant="warning"
        />
      </div>
      <h4 className="question-preview__title">
        {index + 1}.{" "}
        {/* Render LaTeX bằng KaTeX để hiển thị công thức chuẩn */}
        <KaTeXRenderer latex={question.content} displayMode={false} as="span" />
      </h4>
      <ul className="question-preview__options">
        {options.length === 0 ? (
          <li className="question-preview__option question-preview__option--empty">
            {/* Trường hợp API chưa trả đáp án hoặc câu hỏi chưa có lựa chọn */}
            Chưa có đáp án
          </li>
        ) : (
          options.map((option, optionIndex) => (
            <li
              key={option.id ?? `opt-${optionIndex}`}
              className={`question-preview__option ${option.isCorrect ? "question-preview__option--correct" : ""}`.trim()}
            >
              {/* Render nội dung đáp án (có thể chứa công thức) bằng KaTeX */}
              <KaTeXRenderer
                latex={option.content}
                displayMode={false}
                as="span"
              />
              {option.isCorrect ? (
                <span
                  className="question-preview__option-icon"
                  aria-label="Đáp án đúng"
                >
                  <IoCheckmarkCircle />
                </span>
              ) : null}
            </li>
          ))
        )}
      </ul>
      {question.explanation ? (
        <p className="question-preview__explanation">
          {/* Render giải thích bằng KaTeX để hiển thị công thức chuẩn */}
          <KaTeXRenderer latex={question.explanation} displayMode={false} as="span" />
        </p>
      ) : null}
    </article>
  );
};

export default QuestionPreview;
