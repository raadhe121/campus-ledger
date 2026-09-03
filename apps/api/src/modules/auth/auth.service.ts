import { prisma } from "../../lib/prisma.js";
import { verifyPassword } from "../../lib/password.js";
import { signAccessToken } from "../../lib/jwt.js";
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from "../../lib/refreshToken.js";
import { UnauthorizedError, ForbiddenError } from "../../lib/errors.js";
import { toPublicUser } from "../users/user.mapper.js";
import type { LoginInput } from "@campus-ledger/validation-schemas";
import type { PublicUser } from "@campus-ledger/shared-types";

interface Session {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

async function issueSession(userId: string, userAgent?: string): Promise<Session> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    schoolId: user.schoolId,
    tokenVersion: user.tokenVersion,
  });
  const { raw: refreshToken } = await issueRefreshToken(user.id, { userAgent });

  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function login(input: LoginInput, userAgent?: string): Promise<Session> {
  // Deliberately generic on every failure branch below — "wrong email"
  // and "wrong password" read identically to the client (§05).
  const invalid = () => new UnauthorizedError("Invalid email or password");

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw invalid();

  if (user.status === "DISABLED") throw new ForbiddenError("This account has been disabled");
  if (user.status !== "ACTIVE") throw invalid();

  const passwordOk = await verifyPassword(input.password, user.passwordHash);
  if (!passwordOk) throw invalid();

  if (user.schoolId) {
    const school = await prisma.school.findUnique({ where: { id: user.schoolId } });
    if (!school || school.status !== "ACTIVE") {
      throw new ForbiddenError("This school's account is not currently active");
    }
  }

  return issueSession(user.id, userAgent);
}

export async function refresh(rawRefreshToken: string, userAgent?: string): Promise<Session> {
  const { raw: refreshToken, userId } = await rotateRefreshToken(rawRefreshToken, userAgent);
  const session = await issueSession(userId, userAgent);
  return { ...session, refreshToken };
}

export async function logout(rawRefreshToken: string): Promise<void> {
  await revokeRefreshToken(rawRefreshToken);
}
