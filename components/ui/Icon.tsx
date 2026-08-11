import type { ReactNode, SVGProps } from "react";

type IconName =
  | "add"
  | "api"
  | "archive"
  | "check"
  | "chevron-right"
  | "close"
  | "delete"
  | "edit"
  | "empty"
  | "external"
  | "home"
  | "lock"
  | "organization"
  | "people"
  | "role"
  | "search"
  | "settings"
  | "spinner"
  | "unlock"
  | "warning";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: IconName;
  title?: string;
};

const paths: Record<IconName, ReactNode> = {
  add: <path d="M12 5v14M5 12h14" />,
  api: <><path d="M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M8 20H5a1 1 0 0 1-1-1v-3M20 16v3a1 1 0 0 1-1 1h-3" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  archive: <><path d="M4 7h16v13H4z" /><path d="M3 4h18v3H3zM9 12h6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  delete: <><path d="M4 7h16M10 11v5M14 11v5M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13 7 4 4" /></>,
  empty: <><path d="M4 5h16v14H4z" /><path d="M8 9h8M8 13h5" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
  home: <><path d="m3 10 9-7 9 7v10H3z" /><path d="M9 20v-6h6v6" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" /></>,
  organization: <><path d="M4 20V5h10v15M14 10h6v10M7 8h1M10 8h1M7 12h1M10 12h1M7 16h1M10 16h1M16 13h1M16 17h1" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6M18 20v-1a6 6 0 0 0-3-5.2" /></>,
  role: <><path d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7l-8-4Z" /><path d="m8.5 12 2.2 2.2 4.8-4.8" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.5-1H5.3v-3h.2A1.7 1.7 0 0 0 7 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.5 1Z" /></>,
  spinner: <path d="M20 12a8 8 0 1 1-2.3-5.7" />,
  unlock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 7.5-2M12 14v2" /></>,
  warning: <><path d="m12 4 9 16H3L12 4Z" /><path d="M12 10v4M12 17h.01" /></>
};

export function Icon({ name, title, className = "", ...props }: IconProps) {
  const labelled = Boolean(title);
  return (
    <svg
      aria-hidden={labelled ? undefined : true}
      aria-label={title}
      className={`icon ${className}`}
      fill="none"
      focusable="false"
      role={labelled ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      {title && <title>{title}</title>}
      {paths[name]}
    </svg>
  );
}
