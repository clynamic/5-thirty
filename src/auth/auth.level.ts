export enum UserLevel {
  Anonymous = 0,
  Blocked = 10,
  Member = 20,
  Privileged = 30,
  FormerStaff = 34,
  Janitor = 35,
  Moderator = 40,
  Admin = 50,
}

export function getUserLevelFromString(level?: string): UserLevel | undefined {
  if (!level) return undefined;
  const normalizedLevel = level.charAt(0).toUpperCase() + level.slice(1);
  return UserLevel[normalizedLevel as keyof typeof UserLevel];
}
