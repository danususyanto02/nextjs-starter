"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export function SwaggerViewer({ spec }: { spec: Record<string, unknown> }) {
  return <SwaggerUI spec={spec} />;
}
