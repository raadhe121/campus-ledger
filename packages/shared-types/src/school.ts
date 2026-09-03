export const SchoolStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type SchoolStatus = (typeof SchoolStatus)[keyof typeof SchoolStatus];

export interface School {
  id: string;
  name: string;
  slug: string;
  status: SchoolStatus;
  plan: string;
  contactEmail: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}
