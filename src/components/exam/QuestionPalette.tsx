interface QuestionPaletteProps {
  total: number;
  current: number;
  answeredMap: Record<number, boolean>;
  onSelect: (index: number) => void;
}

const QuestionPalette = ({
  total,
  current,
  answeredMap,
  onSelect,
}: QuestionPaletteProps) => {
  return (
    <aside className="question-palette">
      <div className="question-palette__header">
        <h3 className="question-palette__title">Điều hướng câu hỏi</h3>
        <p className="question-palette__meta">
          Chạm để chuyển nhanh giữa các câu.
        </p>
      </div>
      {Array.from({ length: total }).map((_, index) => {
        const classes = [
          "question-palette__item",
          current === index ? "question-palette__item--current" : "",
          answeredMap[index]
            ? "question-palette__item--answered"
            : "question-palette__item--unanswered",
        ]
          .join(" ")
          .trim();

        return (
          <button
            key={index}
            type="button"
            className={classes}
            onClick={() => onSelect(index)}
          >
            {index + 1}
          </button>
        );
      })}
    </aside>
  );
};

export default QuestionPalette;
