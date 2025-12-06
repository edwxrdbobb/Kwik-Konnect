import { NextResponse, type NextRequest } from "next/server"

// Authentication checks are handled in components instead
// This proxy runs for every matched request (replaces the old `middleware` export)
export async function proxy(request: NextRequest) {
  // Simply pass through all requests
  // Supabase auth will still work in components, just not enforced at proxy level
  return NextResponse.next({
    request,
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
