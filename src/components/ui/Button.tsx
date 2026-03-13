import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "outline" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const Button = ({
  children,
  variant = "primary",
  fullWidth = false,
  className,
  ...rest
}: PropsWithChildren<ButtonProps>) => {
  const classes = [
    "btn",
    `btn-${variant}`,
    fullWidth ? "btn-full" : "",
    className ?? "",
  ]
    .join(" ")
    .trim();

  return (
    <button {...rest} className={classes}>
      {children}
    </button>
  );
};

export default Button;
