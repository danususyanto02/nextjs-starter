"use client";

import type { ComponentPropsWithRef } from "react";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
type ButtonSize = "default" | "compact" | "icon";

type ButtonProps = ComponentPropsWithRef<"button"> & {
  CodeAccess?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  CodeAccess: _CodeAccess,
  className = "",
  variant = "primary",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return <button className={`button button-${variant} button-${size} ${className}`} type={type} {...props} />;
}
