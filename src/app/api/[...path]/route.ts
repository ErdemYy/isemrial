import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getTargetUrl(req: NextRequest, path: string[]) {
  const baseUrl =
    process.env.INTERNAL_API_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";

  const search = req.nextUrl.search;
  return `${baseUrl.replace(/\/+$/, "")}/api/${path.join("/")}${search}`;
}

async function handleProxy(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const targetUrl = getTargetUrl(req, path);

  const forwardHeaders = new Headers(req.headers);
  forwardHeaders.delete("host");

  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.arrayBuffer();

  try {
    const apiRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      redirect: "manual",
      cache: "no-store",
    });

    const responseHeaders = new Headers();

    // Preserve headers including set-cookie
    apiRes.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower !== "content-encoding" && lower !== "content-length") {
        responseHeaders.append(key, value);
      }
    });

    const responseBody = await apiRes.arrayBuffer();

    return new NextResponse(responseBody, {
      status: apiRes.status,
      statusText: apiRes.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[API Proxy Error] Hedefe ulaşılamadı (${targetUrl}):`, err.message);
    return NextResponse.json(
      {
        success: false,
        error: "BackendUnavailable",
        message: "Arka uç API servisine ulaşılamıyor. Lütfen sistem durumunu kontrol ediniz.",
      },
      { status: 502 },
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
export const HEAD = handleProxy;
