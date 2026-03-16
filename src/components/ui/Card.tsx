import type { PropsWithChildren, ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

const Card = ({
  title,
  subtitle,
  actions,
  className,
  children,
}: PropsWithChildren<CardProps>) => {
  return (
    <article className={["ui-card", className ?? ""].join(" ").trim()}>
      {title || subtitle || actions ? (
        <header className="ui-card__header">
          <div className="ui-card__headline">
            {title ? <h3 className="ui-card__title">{title}</h3> : null}
            {subtitle ? <p className="ui-card__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="ui-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="ui-card__body">{children}</div>
    </article>
  );
};

export default Card;
