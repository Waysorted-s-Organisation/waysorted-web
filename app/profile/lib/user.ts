export type User = {
  id: string;
  name: string;
  email: string;
  initials: string;
  earlyAccess: boolean;
};

export async function getCurrentUser(): Promise<User> {
  // For a /settings page where you use the signed-in user
  return {
    id: "u_123",
    name: "",
    email: "",
    initials: "RG",
    earlyAccess: true,
  };
}

export async function getUserByHandle(handle: string): Promise<User | null> {
  // Replace with real data access (DB/API). This is a mock.
  if (!handle) return null;

  const initials =
    handle
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || handle.slice(0, 2).toUpperCase();

  // Simple demo rule: treat "guest" as missing early access
  const earlyAccess = handle.toLowerCase() !== "guest";

  return {
    id: handle,
    name: "",
    email: "",
    initials,
    earlyAccess,
  };
}