/** Extracts a readable message from an RTK Query error, matching the shape every mutation in this app throws (architecture §08's error envelope). */
export function apiErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "data" in err) {
    return (err.data as { error?: { message?: string } })?.error?.message ?? "Something went wrong";
  }
  return "Could not reach the server";
}
