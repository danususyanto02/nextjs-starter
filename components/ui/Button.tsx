"use client";
import type { ButtonHTMLAttributes } from "react";
export function Button({ CodeAccess: _CodeAccess, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { CodeAccess?: string }) { return <button className={`rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />; }
