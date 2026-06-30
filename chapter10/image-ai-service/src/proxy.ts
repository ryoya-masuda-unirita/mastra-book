import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// 認証不要の公開パス
const PUBLIC_PATHS = [
  "/auth/signin",
  "/auth/signup",
  "/api/auth",
  "/_next",
  "/favicon.ico",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公開パスはそのまま通す
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // セッション確認
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // 未認証の場合
  if (!session) {
    // APIルートは 401 を返す
    if (isApiPath(pathname)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ページルートはサインインへリダイレクト
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 認証済みユーザーが /auth/* にアクセスした場合は /chat へリダイレクト
  if (pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // _next/static, _next/image, favicon.ico を除く全パス
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
