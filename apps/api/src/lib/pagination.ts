const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface PageParams {
  page: number;
  limit: number;
  skip: number;
}

/** `?page=&limit=` — the convention fixed in architecture §08, shared by every list endpoint. */
export function parsePagination(query: Record<string, unknown>): PageParams {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginationMeta(total: number, { page, limit }: PageParams) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
