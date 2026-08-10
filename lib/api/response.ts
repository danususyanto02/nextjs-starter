import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) { return NextResponse.json({ data }, init); }
export function error(code: string, message: string, status: number, details?: unknown) { return NextResponse.json({ error: { code, message, ...(details === undefined ? {} : { details }) } }, { status }); }
export function mapPrismaError(caught: unknown) {
  const code = (caught as { code?: string }).code;
  if (code === "P2025") return error("NOT_FOUND", "Resource not found", 404);
  if (code === "P2002") return error("CONFLICT", "Resource already exists", 409);
  return error("INTERNAL_ERROR", "Internal server error", 500);
}
