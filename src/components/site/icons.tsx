import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const sharedProps = {
  "aria-hidden": true,
  focusable: false,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
};

const iconClassName = (className?: string) =>
  `inline-block size-[1em] shrink-0 ${className ?? ""}`.trim();

export function ArrowUpRightIcon({ className, ...props }: IconProps) {
  return (
    <svg {...sharedProps} {...props} className={iconClassName(className)}>
      <path d="M6 18 18 6M8 6h10v10" />
    </svg>
  );
}

export function ArrowRightIcon({ className, ...props }: IconProps) {
  return (
    <svg {...sharedProps} {...props} className={iconClassName(className)}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowLeftIcon({ className, ...props }: IconProps) {
  return (
    <svg {...sharedProps} {...props} className={iconClassName(className)}>
      <path d="M20 12H4M10 6l-6 6 6 6" />
    </svg>
  );
}

export function ArrowUpIcon({ className, ...props }: IconProps) {
  return (
    <svg {...sharedProps} {...props} className={iconClassName(className)}>
      <path d="M12 20V4M6 10l6-6 6 6" />
    </svg>
  );
}

export function ArrowDownIcon({ className, ...props }: IconProps) {
  return (
    <svg {...sharedProps} {...props} className={iconClassName(className)}>
      <path d="M12 4v16M6 14l6 6 6-6" />
    </svg>
  );
}

export function AsteriskIcon({ className, ...props }: IconProps) {
  return (
    <svg {...sharedProps} {...props} className={iconClassName(className)}>
      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07" />
    </svg>
  );
}

export function CheckIcon({ className, ...props }: IconProps) {
  return (
    <svg {...sharedProps} {...props} className={iconClassName(className)}>
      <path d="m4 12 5 5L20 6" />
    </svg>
  );
}
