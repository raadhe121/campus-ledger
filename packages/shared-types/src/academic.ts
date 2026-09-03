export interface AcademicYear {
  id: string;
  schoolId: string;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  schoolId: string;
  academicYearId: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  schoolId: string;
  classId: string;
  name: string;
  roomNo: string | null;
  classTeacherId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  isElective: boolean;
  createdAt: string;
  updatedAt: string;
}
