import { Role, User, Organization } from "@prisma/client";

export interface AuthenticatedUserContext {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: Role;
}

export interface RequestWithUser extends Express.Request {
  user?: AuthenticatedUserContext;
  sessionToken?: string;
}
