import { vi } from "vitest";

export interface MockSession {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  expires: string;
}

export const DEFAULT_SESSION: MockSession = {
  user: {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * The mock auth function.
 * Set `mockAuthFn.mockResolvedValue(session)` to change the session.
 */
export const mockAuthFn = vi.fn().mockResolvedValue(DEFAULT_SESSION);
export const mockSignIn = vi.fn();
export const mockSignOut = vi.fn();
