// In-memory store for mock check-ins during the session
// Extracted from route to avoid Next.js treating it as a route export
export const mockCheckIns = new Map<string, { checkInTime: string; method: string }>();
