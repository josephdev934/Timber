import { NextResponse } from "next/server";
import { UserService } from "@/application/services/UserService";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

/**
 * ==========================================
 * API ROUTE: GET /api/users/search?q=...
 * ==========================================
 */
export async function GET(req: Request) {
  try {
    await protectRoute(req as any);
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    let users;
    if (!query || query.trim().length === 0) {
      // If no query, return the most recent 10 users
      users = await UserService.searchUsers("");
    } else {
      users = await UserService.searchUsers(query.trim());
    }
    
    // Format for frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name || user.username, 
      username: user.username, // Remove @ to avoid double @ issue
      avatar: user.profilePhoto || "/default-avatar.svg"
    }));

    return NextResponse.json(formattedUsers);
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    return NextResponse.json(
      { error: err.message }, 
      { status: isAuthError ? 401 : 500 }
    );
  }
}
