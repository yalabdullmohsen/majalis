import { dispatchApiRequest } from "../../../../lib/api-dispatch.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handleApi(request: Request, pathSegments: string[] = []) {
  const url = new URL(request.url);
  const apiPath = `/api/${pathSegments.join("/")}${url.search}`;

  const headers: Record<string, string | string[] | undefined> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let body: unknown = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const text = await request.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    } else {
      body = {};
    }
  }

  const req = {
    method: request.method,
    url: apiPath,
    headers,
    body,
    query: Object.fromEntries(url.searchParams.entries()),
  };

  let statusCode = 200;
  const responseHeaders = new Headers();
  let responseBody: string | null = null;
  let headersSent = false;

  const res = {
    statusCode: 200,
    headersSent: false,
    setHeader(name: string, value: string) {
      responseHeaders.set(name, value);
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      responseHeaders.set("Content-Type", "application/json; charset=utf-8");
      responseBody = JSON.stringify(payload);
      headersSent = true;
    },
    end(data?: string) {
      if (data !== undefined) responseBody = data;
      headersSent = true;
    },
  };

  await dispatchApiRequest(req, res);

  if (!headersSent && responseBody === null) {
    return new Response(null, { status: statusCode, headers: responseHeaders });
  }

  return new Response(responseBody, { status: statusCode, headers: responseHeaders });
}

async function withPath(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  return handleApi(request, path);
}

export async function GET(request: Request, context: RouteContext) {
  return withPath(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return withPath(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return withPath(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return withPath(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return withPath(request, context);
}

export async function OPTIONS(request: Request, context: RouteContext) {
  return withPath(request, context);
}

export async function HEAD(request: Request, context: RouteContext) {
  return withPath(request, context);
}
