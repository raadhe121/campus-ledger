import type { ParentStudentLinkWithStudent } from "@campus-ledger/shared-types";

/** The child-switcher shown on every Parent screen once there's more than one linked child. */
export function ChildPicker({
  options,
  studentId,
  onChange,
}: {
  options: ParentStudentLinkWithStudent[];
  studentId: string;
  onChange: (studentId: string) => void;
}) {
  if (options.length <= 1) return null;
  return (
    <select
      value={studentId}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm font-medium card-shadow"
    >
      {options.map((c) => (
        <option key={c.studentId} value={c.studentId}>
          {c.student.firstName} {c.student.lastName}
        </option>
      ))}
    </select>
  );
}
