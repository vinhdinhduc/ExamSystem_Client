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
      <div className="question-palette__grid">
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
      </div>
      <div className="question-palette__legend">
        <div className="question-palette__legend-item">
          <span className="question-palette__item question-palette__item--answered" style={{ width: 16, height: 16 }} />
          <span>Đã làm</span>
        </div>
        <div className="question-palette__legend-item">
          <span className="question-palette__item question-palette__item--unanswered" style={{ width: 16, height: 16 }} />
          <span>Chưa làm</span>
        </div>
        <div className="question-palette__legend-item">
          <span className="question-palette__item question-palette__item--current" style={{ width: 16, height: 16 }} />
          <span>Hiện tại</span>
        </div>
      </div>
    </aside>
  );
};

export default QuestionPalette;
