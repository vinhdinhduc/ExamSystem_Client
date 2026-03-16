import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface BaseProps {
  label: string;
  hint?: string;
  registration?: UseFormRegisterReturn;
  error?: FieldError;
  multiline?: boolean;
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

const FormInput = ({
  label,
  hint,
  registration,
  error,
  multiline = false,
  className,
  ...rest
}: InputProps | TextareaProps) => {
  return (
    <label className="ui-form-field">
      <span className="ui-form-field__label">{label}</span>
      {multiline ? (
        <textarea
          className={["ui-form-field__control", className ?? ""]
            .join(" ")
            .trim()}
          {...(registration as UseFormRegisterReturn | undefined)}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={["ui-form-field__control", className ?? ""]
            .join(" ")
            .trim()}
          {...(registration as UseFormRegisterReturn | undefined)}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {hint ? <span className="ui-form-field__hint">{hint}</span> : null}
      {error ? (
        <span className="ui-form-field__error">{error.message}</span>
      ) : null}
    </label>
  );
};

export default FormInput;
