import { Link, useParams } from "react-router-dom";
import { useGetExamSubjectQuery } from "./examSubjectsApi";
import { MarksEntryForm } from "./MarksEntryForm";

export function ExamMarksPage() {
  const { examSubjectId } = useParams<{ examSubjectId: string }>();
  const { data, isLoading } = useGetExamSubjectQuery(examSubjectId!);

  if (isLoading) return <div className="h-40 rounded-2xl bg-surface-2 animate-pulse" />;
  if (!data) return <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Exam subject not found.</p>;

  const es = data.data;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          to={`/school-admin/exams/${es.examId}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted hover:text-ink hover:bg-surface-2"
        >
          ← {es.exam.name}
        </Link>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-gold mt-4">Marks entry</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">
          {es.subject.name} · {es.section.className} {es.section.name}
        </h1>
      </div>

      <MarksEntryForm examSubjectId={es.id} maxMarks={es.maxMarks} passMarks={es.passMarks} />
    </div>
  );
}
