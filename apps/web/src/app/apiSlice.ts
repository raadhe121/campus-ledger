import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { ApiSuccess, PublicUser } from "@campus-ledger/shared-types";
import type { RootState } from "./store";
import { credentialsReceived, loggedOut } from "../features/auth/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1",
  credentials: "include", // sends the httpOnly refresh-token cookie
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

function isAuthRoute(args: string | FetchArgs): boolean {
  const url = typeof args === "string" ? args : args.url;
  return url.startsWith("/auth/");
}

/**
 * A 15-minute access token expiring mid-session is the normal case, not
 * an error — this wrapper catches the resulting 401 once, spends the
 * refresh cookie to get a new access token (§05's rotation), and
 * silently retries the original request. Only a *second* 401 (the
 * refresh itself failing) ends the session. Auth endpoints are excluded
 * so a bad login attempt doesn't trigger this at all.
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !isAuthRoute(args)) {
    const refreshResult = await rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions);

    if (refreshResult.data) {
      const { user, accessToken } = (refreshResult.data as ApiSuccess<{ user: PublicUser; accessToken: string }>).data;
      api.dispatch(credentialsReceived({ user, accessToken }));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(loggedOut());
    }
  }

  return result;
};

// The one RTK Query instance for the app. Every feature (auth, schools,
// attendance, ...) injects its endpoints into this base rather than
// creating a separate api slice — one cache, one set of tags, one place
// that attaches the access token and handles its expiry (architecture §09).
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "School",
    "SchoolAdmins",
    "User",
    "AcademicYear",
    "Class",
    "Section",
    "Subject",
    "Teacher",
    "Student",
    "Parent",
    "ParentChildren",
    "Staff",
    "Enrollment",
    "MyStudentDashboard",
    "MyTeacherDashboard",
    "TimetableSlot",
    "AttendanceRoster",
    "MyAttendance",
    "MyTimetable",
    "Exam",
    "ExamSubject",
    "MarksRoster",
    "MyResults",
    "MyExamSubjects",
    "Assignment",
    "Submissions",
    "MyAssignments",
    "MyChildren",
    "ChildDashboard",
    "ChildAttendance",
    "ChildTimetable",
    "ChildResults",
    "ChildAssignments",
    "ChildFees",
    "FeeStructure",
    "StudentFee",
    "Payment",
    "Expense",
    "MyFees",
    "SchoolWebsite",
    "Announcement",
  ],
  endpoints: () => ({}),
});
