import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { listUsersHandler, getUserHandler } from "./users.controller.js";

// Mounted at /api/v1/users — a school-scoped role's view of "people at
// my school". SCHOOL_ADMIN only for now; TEACHER/STUDENT/PARENT get
// their own narrower views as Phase 02+ modules land.
export const usersRouter = Router();

usersRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN"));

usersRouter.get("/", asyncHandler(listUsersHandler));
usersRouter.get("/:userId", asyncHandler(getUserHandler));
