"use client";

import { useUserContext } from "@/context/UserContext";
import type { IUser } from "@/types/user";

// Wrapper hook to maintain backward compatibility but use global context
// 'auto' parameter is ignored as the context handles fetching globally
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useUser(auto: boolean = true) {
  return useUserContext();
}