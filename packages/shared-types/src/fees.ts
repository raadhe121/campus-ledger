export type FeeFrequency = "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "ANNUAL";
export type StudentFeeStatus = "PENDING" | "PARTIAL" | "PAID";
export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "CHEQUE" | "ONLINE" | "OTHER";

export interface FeeItem {
  id: string;
  schoolId: string;
  feeStructureId: string;
  label: string;
  amount: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructure {
  id: string;
  schoolId: string;
  academicYearId: string;
  classId: string;
  name: string;
  frequency: FeeFrequency;
  createdAt: string;
  updatedAt: string;
}

/** A FeeStructure joined with the labels a list screen renders, plus its own line items. */
export interface FeeStructureWithDetails extends FeeStructure {
  academicYear: { id: string; label: string };
  class: { id: string; name: string };
  items: FeeItem[];
}

export interface StudentFee {
  id: string;
  schoolId: string;
  studentId: string;
  feeItemId: string;
  amountDue: number;
  amountPaid: number;
  status: StudentFeeStatus;
  createdAt: string;
  updatedAt: string;
}

/** A StudentFee joined with the fee item/structure it charges against and whether it's past due — computed server-side (§04's grade-computed pattern), never stored. */
export interface StudentFeeWithDetails extends StudentFee {
  isOverdue: boolean;
  feeItem: { id: string; label: string; amount: number; dueDate: string };
  feeStructure: { id: string; name: string; frequency: FeeFrequency };
  student: { id: string; firstName: string; lastName: string; admissionNo: string | null };
}

export interface Payment {
  id: string;
  schoolId: string;
  studentFeeId: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  receivedById: string;
  paidAt: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  schoolId: string;
  paymentId: string;
  receiptNo: string;
  pdfUrl: string | null;
  issuedAt: string;
}

/** A Payment joined with the receipt it issued and enough context (student, fee item, school, who recorded it) to render a printable receipt without a second round trip. */
export interface PaymentWithDetails extends Payment {
  receipt: Receipt;
  receivedBy: { id: string; firstName: string; lastName: string };
  studentFee: {
    id: string;
    student: { id: string; firstName: string; lastName: string; admissionNo: string | null };
    feeItem: { id: string; label: string };
    feeStructure: { id: string; name: string };
  };
}

export interface Expense {
  id: string;
  schoolId: string;
  category: string;
  amount: number;
  vendor: string | null;
  description: string | null;
  date: string;
  recordedById: string;
  createdAt: string;
  updatedAt: string;
}

/** An Expense joined with who recorded it — what the Expenses list actually renders per row. */
export interface ExpenseWithDetails extends Expense {
  recordedBy: { id: string; firstName: string; lastName: string };
}
