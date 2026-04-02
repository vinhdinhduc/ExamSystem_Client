import Button from "./Button";
import Modal from "./Modal";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => (
  <Modal open={open} title={title} onClose={onCancel}>
    <p className="confirm-modal__message">{message}</p>
    <div className="admin-page__form-actions">
      <Button variant="ghost" disabled={loading} onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button variant={variant} disabled={loading} onClick={onConfirm}>
        {loading ? "Đang xử lý..." : confirmLabel}
      </Button>
    </div>
  </Modal>
);

export default ConfirmModal;