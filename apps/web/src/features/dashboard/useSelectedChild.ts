import { useState } from "react";
import { useGetMyChildrenQuery } from "../me/meApi";

/** The "which child" picker every Parent screen starts from — shared so each one doesn't re-derive it. */
export function useSelectedChild() {
  const { data, isLoading, error } = useGetMyChildrenQuery();
  const children = data?.data ?? [];
  const [override, setOverride] = useState("");
  const studentId = children.some((c) => c.studentId === override) ? override : (children[0]?.studentId ?? "");
  const selected = children.find((c) => c.studentId === studentId) ?? null;

  return { children, studentId, selected, setStudentId: setOverride, isLoading, error };
}
