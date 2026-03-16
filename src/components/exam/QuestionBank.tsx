import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  IoAddCircleOutline,
  IoArrowForward,
  IoDocumentTextOutline,
} from "react-icons/io5";
import type { Question } from "../../types/question";
import Badge from "../ui/Badge";
import { getDifficultyLabel, getQuestionTypeLabel } from "../../utils/examUi";

interface QuestionBankProps {
  leftTitle?: string;
  rightTitle?: string;
  available: Question[];
  selected: Question[];
  onChange: (selectedIds: string[]) => void;
}

const QuestionBank = ({
  leftTitle = "Question Bank",
  rightTitle = "Exam Questions",
  available,
  selected,
  onChange,
}: QuestionBankProps) => {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const sourceId = result.source.droppableId;
    const destinationId = result.destination.droppableId;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceId === destinationId && sourceId === "selected") {
      const next = [...selected];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(destinationIndex, 0, moved);
      onChange(next.map((question) => question.id));
      return;
    }

    if (sourceId === "available" && destinationId === "selected") {
      const nextSelected = [...selected];
      nextSelected.splice(destinationIndex, 0, available[sourceIndex]);
      onChange(
        Array.from(new Set(nextSelected.map((question) => question.id))),
      );
      return;
    }

    if (sourceId === "selected" && destinationId === "available") {
      const nextSelected = selected.filter((_, index) => index !== sourceIndex);
      onChange(nextSelected.map((question) => question.id));
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="question-bank">
        <Droppable droppableId="available">
          {(provided) => (
            <section
              className="question-bank__column"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <div className="question-bank__column-head">
                <div>
                  <h4 className="question-bank__title">{leftTitle}</h4>
                  <p className="question-bank__meta">
                    Kéo câu hỏi sang phải để thêm vào đề.
                  </p>
                </div>
                <span className="question-bank__count">{available.length}</span>
              </div>
              {available.map((question, index) => (
                <Draggable
                  key={question.id}
                  draggableId={`available-${question.id}`}
                  index={index}
                >
                  {(dragProvided) => (
                    <div
                      className="question-bank__item"
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                    >
                      <div className="question-bank__item-head">
                        <IoDocumentTextOutline className="question-bank__item-icon" />
                        <div>
                          <h5 className="question-bank__item-title">
                            {question.content}
                          </h5>
                          <div className="question-bank__item-badges">
                            <Badge
                              label={getQuestionTypeLabel(
                                question.questionType,
                              )}
                              variant="info"
                            />
                            <Badge
                              label={getDifficultyLabel(
                                question.difficultyLevel,
                              )}
                              variant="warning"
                            />
                          </div>
                        </div>
                      </div>
                      <button type="button" className="question-bank__cta">
                        <IoAddCircleOutline />
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </section>
          )}
        </Droppable>

        <Droppable droppableId="selected">
          {(provided) => (
            <section
              className="question-bank__column question-bank__column--active"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <div className="question-bank__column-head">
                <div>
                  <h4 className="question-bank__title">{rightTitle}</h4>
                  <p className="question-bank__meta">
                    Sắp xếp thứ tự câu bằng kéo thả như Google Form.
                  </p>
                </div>
                <span className="question-bank__count">{selected.length}</span>
              </div>
              {selected.map((question, index) => (
                <Draggable
                  key={question.id}
                  draggableId={`selected-${question.id}`}
                  index={index}
                >
                  {(dragProvided) => (
                    <div
                      className="question-bank__item question-bank__item--selected"
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                    >
                      <div>
                        <span className="question-bank__order">
                          Câu {index + 1}
                        </span>
                        <h5 className="question-bank__item-title">
                          {question.content}
                        </h5>
                      </div>
                      <IoArrowForward className="question-bank__cta question-bank__cta--reverse" />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </section>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
};

export default QuestionBank;
