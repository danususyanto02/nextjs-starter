import { getOpenApiDocument } from "@/lib/openapi/document";
import { SwaggerViewer } from "@/components/api/SwaggerViewer";
export default function DocsPage() { const document = getOpenApiDocument(); return <main className="min-h-screen bg-slate-950 p-8"><h1 className="text-3xl font-bold text-white">API Documentation</h1><p className="mb-8 mt-2 text-slate-300">OpenAPI 3.1. Bearer JWT and Auth.js cookie sessions are supported by deployed routes.</p><SwaggerViewer spec={document as unknown as Record<string, unknown>} /></main>; }
