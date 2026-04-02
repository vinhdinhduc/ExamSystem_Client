import type { Question } from "../../types/question";
import Badge from "../ui/Badge";
import {
  getDifficultyLabel,
  getQuestionOptions,
  getQuestionTypeLabel,
} from "../../utils/examUi";

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
        {index + 1}. {question.content}
      </h4>
      <ul className="question-preview__options">
        {options.map((option) => (
          <li key={option.id} className="question-preview__option">
            {option.content}
          </li>
        ))}
      </ul>
      {question.explanation ? (
        <p className="question-preview__explanation">{question.explanation}</p>
      ) : null}
    </article>
  );
};

export default QuestionPreview;
