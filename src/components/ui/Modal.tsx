import type { PropsWithChildren } from "react";
import { IoClose } from "react-icons/io5";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  size?: "md" | "lg";
  onClose: () => void;
}

const Modal = ({
  open,
  title,
  description,
  size = "md",
  onClose,
  children,
}: PropsWithChildren<ModalProps>) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="ui-modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="ui-modal__backdrop"
        onClick={onClose}
        aria-label="Đóng"
      />
      <div className={`ui-modal__panel ui-modal__panel--${size}`}>
        <div className="ui-modal__header">
          <div>
            <h3 className="ui-modal__title">{title}</h3>
            {description ? (
              <p className="ui-modal__description">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="ui-modal__close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <IoClose />
          </button>
        </div>
        <div className="ui-modal__body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
