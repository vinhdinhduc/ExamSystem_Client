import type { Question } from "../../types/question";
import Badge from "../ui/Badge";
import {
  getDifficultyLabel,
  getQuestionOptions,
  getQuestionTypeLabel,
} from "../../utils/examUi";

interface QuestionCardProps {
  question: Question;
  value: number[];
  onChange: (ids: number[]) => void;
}

const QuestionCard = ({ question, value, onChange }: QuestionCardProps) => {
  const options = getQuestionOptions(question);
  const isMultiple = question.questionType === 1;

  return (
    <article className="question-card">
      <div className="question-card__meta">
        <Badge
          label={getQuestionTypeLabel(question.questionType)}
          variant="info"
        />
        <Badge
          label={getDifficultyLabel(question.difficultyLevel)}
          variant="warning"
        />
      </div>
      <h3 className="question-card__title">{question.content}</h3>
      <div className="question-card__answers">
        {options.map((option) => {
          const checked = value.includes(option.id);

          return (
            <label key={option.id} className="question-card__answer">
              <input
                type={isMultiple ? "checkbox" : "radio"}
                checked={checked}
                onChange={(event) => {
                  if (isMultiple) {
                    onChange(
                      event.target.checked
                        ? [...value, option.id]
                        : value.filter((id) => id !== option.id),
                    );
                    return;
                  }
                  onChange([option.id]);
                }}
              />
              <span className="question-card__answer-text">
                {option.content}
              </span>
            </label>
          );
        })}
      </div>
    </article>
  );
};

export default QuestionCard;
