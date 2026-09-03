import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { schoolsRouter } from "./modules/schools/schools.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { transcriptionRouter } from "./modules/transcription/transcription.routes.js";
import { academicYearsRouter } from "./modules/academic-years/academic-years.routes.js";
import { classesRouter } from "./modules/classes/classes.routes.js";
import { sectionsRouter } from "./modules/sections/sections.routes.js";
import { subjectsRouter } from "./modules/subjects/subjects.routes.js";
import { teachersRouter } from "./modules/teachers/teachers.routes.js";
import { studentsRouter } from "./modules/students/students.routes.js";
import { parentsRouter } from "./modules/parents/parents.routes.js";
import { staffRouter } from "./modules/staff/staff.routes.js";
import { enrollmentRouter } from "./modules/enrollment/enrollment.routes.js";
import { meRouter } from "./modules/me/me.routes.js";
import { timetableRouter } from "./modules/timetable/timetable.routes.js";
import { attendanceRouter } from "./modules/attendance/attendance.routes.js";
import { examsRouter } from "./modules/exams/exams.routes.js";
import { examSubjectsRouter } from "./modules/exam-subjects/exam-subjects.routes.js";
import { assignmentsRouter } from "./modules/assignments/assignments.routes.js";
import { feeStructuresRouter } from "./modules/fee-structures/fee-structures.routes.js";
import { studentFeesRouter } from "./modules/student-fees/student-fees.routes.js";
import { paymentsRouter } from "./modules/payments/payments.routes.js";
import { expensesRouter } from "./modules/expenses/expenses.routes.js";
import { assistantRouter } from "./modules/assistant/assistant.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { schoolWebsiteRouter } from "./modules/school-website/school-website.routes.js";
import { publicSiteRouter } from "./modules/school-website/public-site.routes.js";

const PUBLIC_PREFIX = "/api/v1/public";

export function createApp() {
  const app = express();

  app.use(helmet());
  // One CORS middleware, not two — a route-scoped `cors()` mounted after
  // this one would never run its own preflight handling, since this
  // middleware already answers every OPTIONS request itself before
  // Express routing reaches anything mounted later (see public-site.routes.ts's
  // own comment). Per-request `origin` here is what lets /api/v1/public/*
  // stay wide open (any school-site deployment, unknown host/port, no
  // credentials) while every other route keeps the tight single-origin +
  // credentialed policy the refresh-token cookie needs (§05).
  app.use(
    cors((req, callback) => {
      const isPublic = req.path.startsWith(PUBLIC_PREFIX);
      callback(null, isPublic ? { origin: true, credentials: false } : { origin: env.WEB_ORIGIN, credentials: true });
    }),
  );
  app.use(pinoHttp({ logger }));
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/super-admin/schools", schoolsRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/academic-years", academicYearsRouter);
  app.use("/api/v1/classes", classesRouter);
  app.use("/api/v1/sections", sectionsRouter);
  app.use("/api/v1/subjects", subjectsRouter);
  app.use("/api/v1/teachers", teachersRouter);
  app.use("/api/v1/students", studentsRouter);
  app.use("/api/v1/parents", parentsRouter);
  app.use("/api/v1/staff", staffRouter);
  app.use("/api/v1/enrollments", enrollmentRouter);
  app.use("/api/v1/me", meRouter);
  app.use("/api/v1/timetable", timetableRouter);
  app.use("/api/v1/attendance", attendanceRouter);
  app.use("/api/v1/exams", examsRouter);
  app.use("/api/v1/exam-subjects", examSubjectsRouter);
  app.use("/api/v1/assignments", assignmentsRouter);
  app.use("/api/v1/fee-structures", feeStructuresRouter);
  app.use("/api/v1/student-fees", studentFeesRouter);
  app.use("/api/v1/payments", paymentsRouter);
  app.use("/api/v1/expenses", expensesRouter);
  app.use("/api/v1/assistant", assistantRouter);
  app.use("/api/v1/reports", reportsRouter);
  app.use("/api/v1/school-website", schoolWebsiteRouter);
  app.use(PUBLIC_PREFIX, publicSiteRouter);
  app.use("/api/v1/dev", transcriptionRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
