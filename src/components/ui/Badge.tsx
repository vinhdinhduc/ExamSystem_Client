interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const Badge = ({ label, variant = "default" }: BadgeProps) => {
  return <span className={`ui-badge ui-badge--${variant}`}>{label}</span>;
};

export default Badge;
