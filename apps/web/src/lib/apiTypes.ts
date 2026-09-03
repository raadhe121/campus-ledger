/** The list-endpoint shape every module returns (architecture §08's pagination convention). */
export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
