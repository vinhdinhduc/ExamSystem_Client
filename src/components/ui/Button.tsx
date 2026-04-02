import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  iconLeft,
  iconRight,
  className,
  ...rest
}: PropsWithChildren<ButtonProps>) => {
  const classes = [
    "ui-button",
    `ui-button--${variant}`,
    `ui-button--${size}`,
    fullWidth ? "ui-button--full" : "",
    className ?? "",
  ]
    .join(" ")
    .trim();

  return (
    <button {...rest} className={classes}>
      {iconLeft ? <span className="ui-button__icon">{iconLeft}</span> : null}
      <span className="ui-button__label">{children}</span>
      {iconRight ? <span className="ui-button__icon">{iconRight}</span> : null}
    </button>
  );
};

export default Button;
