import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '../lib/auth';

// Paths that don't require authentication
const publicPaths = ['/login', '/api/auth/login', '/api/migrate-db'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Static assets and internal next paths are usually skipped by matcher, but just in case
  if (path.startsWith('/_next') || path.startsWith('/static')) {
    return NextResponse.next();
  }

  const isPublicPath = publicPaths.includes(path);
  const sessionToken = request.cookies.get('session')?.value;
  let sessionPayload = null;

  if (sessionToken) {
    sessionPayload = await verifySession(sessionToken);
  }

  // Redirect to login if unauthenticated and trying to access a protected route
  if (!sessionPayload && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if authenticated and trying to access login
  if (sessionPayload && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Frontend route protection for admin-only pages
  if (sessionPayload && path === '/audit' && sessionPayload.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // RBAC for APIs
  if (path.startsWith('/api/') && !isPublicPath && sessionPayload) {
    const role = sessionPayload.role as string;
    
    // Only admin can access /api/users and /api/audit
    if ((path.startsWith('/api/users') || path.startsWith('/api/audit')) && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Role restrictions for writing data
    if (request.method !== 'GET' && path !== '/api/auth/logout') {
      if (role === 'viewer') {
        return NextResponse.json({ error: 'Forbidden: Viewers cannot modify data' }, { status: 403 });
      }

      // Editors can POST (create) but not PUT/DELETE (edit/delete)
      if (role === 'editor' && (request.method === 'PUT' || request.method === 'DELETE')) {
        return NextResponse.json({ error: 'Forbidden: Editors cannot modify or delete existing data' }, { status: 403 });
      }
    }
  }

  // Attach role header for server components to use (optional, but helpful)
  const response = NextResponse.next();
  if (sessionPayload) {
    response.headers.set('x-user-role', sessionPayload.role as string);
    response.headers.set('x-user-email', sessionPayload.email as string);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png (logo)
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
};
