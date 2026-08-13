import type { ReactNode } from "react";
import { createContext, Fragment, useContext } from "react";
import { Typography } from "antd";
import type { LocaleKey } from "./i18n";

const { Title } = Typography;

const PortalPageHeroContext = createContext<{
  compact: boolean;
  locale: LocaleKey;
}>({ compact: false, locale: "ja-JP" });

const homeLabels: Record<LocaleKey, string> = {
  "ja-JP": "ホーム",
  "zh-CN": "首页",
  "en-US": "Home",
};

export function PortalPageHeroProvider({
  compact,
  locale,
  children,
}: {
  compact: boolean;
  locale: LocaleKey;
  children: ReactNode;
}) {
  return (
    <PortalPageHeroContext.Provider value={{ compact, locale }}>
      {children}
    </PortalPageHeroContext.Provider>
  );
}

export function PortalPageHero({
  icon,
  eyebrow,
  title,
  description,
  actions,
  className = "",
}: {
  icon: ReactNode;
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const { compact, locale } = useContext(PortalPageHeroContext);
  const classes = `portal-page-hero ${className}`.trim();

  if (compact) {
    return (
      <Fragment>
        <nav className={`${classes} portal-page-breadcrumb`} aria-label={String(title)}>
          <span className="portal-page-hero-icon">{icon}</span>
          <ol>
            <li>{homeLabels[locale]}</li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
        {actions && <div className="portal-page-compact-actions">{actions}</div>}
      </Fragment>
    );
  }

  return (
    <section className={classes}>
      <span className="portal-page-hero-icon">{icon}</span>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <Title level={1}>{title}</Title>
        <div className="portal-page-hero-description">{description}</div>
      </div>
      {actions && <div className="portal-page-hero-actions">{actions}</div>}
    </section>
  );
}
