import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { useEffect, useRef } from "react";
import MathLiveEditor from "./MathLiveEditor";

interface MathLiveFormInputProps {
  label: string;
  // Registration cho react-hook-form (dùng input hidden)
  registration: UseFormRegisterReturn;
  // Giá trị LaTeX đang được lưu trong form
  value: string;
  // Placeholder cho MathLive
  placeholder?: string;
  // Lỗi validation hiển thị dưới label
  error?: FieldError;
  // Text hint hiển thị dưới control (nếu có)
  hint?: string;
  // Khóa không cho chỉnh sửa
  disabled?: boolean;
}

const MathLiveFormInput = ({
  label,
  registration,
  value,
  placeholder,
  error,
  hint,
  disabled,
}: MathLiveFormInputProps) => {
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const rhfOnChange = registration.onChange;
  const rhfName = (registration as unknown as { name?: string }).name;

  // Khi latex thay đổi từ ngoài (reset/setValue), cập nhật lại DOM hidden input
  useEffect(() => {
    if (!hiddenInputRef.current) return;
    hiddenInputRef.current.value = value ?? "";
    // Báo cho react-hook-form biết DOM value đã thay đổi
    hiddenInputRef.current.dispatchEvent(
      new Event("input", { bubbles: true }),
    );
    hiddenInputRef.current.dispatchEvent(
      new Event("change", { bubbles: true }),
    );

    // Chủ động cập nhật internal state của RHF (ít phụ thuộc vào loại event)
    if (rhfOnChange) {
      rhfOnChange({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        target: { value: value ?? "", name: rhfName } as any,
      } as any);
    }
  }, [value]);

  const setHiddenRef = (el: HTMLInputElement | null) => {
    hiddenInputRef.current = el;
    if (!el) return;

    // Gắn ref của react-hook-form để nó quản lý value/validation
    const registerRef = registration.ref;
    if (typeof registerRef === "function") {
      registerRef(el);
    }
  };

  // Khi người dùng nhập trong MathLive, đẩy latex vào hidden input để RHF nhận change
  const handleLatexChange = (nextLatex: string) => {
    if (!hiddenInputRef.current) return;
    hiddenInputRef.current.value = nextLatex;
    // Đảm bảo RHF bắt được thay đổi (tuỳ trường hợp nó lắng nghe 'change' hoặc 'input')
    hiddenInputRef.current.dispatchEvent(
      new Event("input", { bubbles: true }),
    );
    hiddenInputRef.current.dispatchEvent(
      new Event("change", { bubbles: true }),
    );

    // Chủ động cập nhật internal state của RHF
    if (rhfOnChange) {
      rhfOnChange({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        target: { value: nextLatex, name: rhfName } as any,
      } as any);
    }
  };

  const {
    ref: _registerRef,
    // onChange/onBlur được spread vào hidden input (RHF sẽ bắt sự kiện input/bblur)
    ...rest
  } = registration;

  return (
    <label className="ui-form-field">
      <span className="ui-form-field__label">{label}</span>

      <MathLiveEditor
        value={value ?? ""}
        onChange={handleLatexChange}
        placeholder={placeholder}
        disabled={disabled}
        className="mathlive-editor"
      />

      {/* Hidden input dùng để react-hook-form lưu và validate */}
      <input type="hidden" {...rest} ref={setHiddenRef} />

      {hint ? <span className="ui-form-field__hint">{hint}</span> : null}
      {error ? (
        <span className="ui-form-field__error">{error.message}</span>
      ) : null}
    </label>
  );
};

export default MathLiveFormInput;

