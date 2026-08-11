import Link from "next/link";
import { SwaggerViewer } from "@/components/api/SwaggerViewer";
import { Icon } from "@/components/ui/Icon";
import { getOpenApiDocument } from "@/lib/openapi/document";

export default function DocsPage() {
  const document = getOpenApiDocument();
  return <main className="page-shell min-h-screen"><div className="mx-auto max-w-[1280px] p-5 sm:p-8"><header className="document-header"><div className="toolbar"><div className="document-title-row"><span className="page-icon"><Icon name="api" /></span><div><p className="eyebrow">Developer reference</p><h1 className="document-title mt-1">API Documentation</h1></div></div><Link className="button button-secondary" href="/"><Icon name="home" />Home</Link></div><p className="document-description">OpenAPI 3.1. Bearer JWT and Auth.js cookie sessions are supported by deployed routes.</p></header><div className="swagger-shell mt-6 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6"><SwaggerViewer spec={document as unknown as Record<string, unknown>} /></div></div></main>;
}
