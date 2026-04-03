export type EntryFormData = {
  projectId: string;
  date: string;
  hours: string;
  description: string;
  billable: boolean;
  mileageKm?: string;
};

export type EditFormData = {
  hours: string;
  description: string;
  billable: boolean;
  mileageKm?: string;
};

export type EntryFormErrors = Partial<
  Record<"projectId" | "date" | "hours" | "description", string>
>;

export function validateEntryForm(data: EntryFormData): EntryFormErrors {
  const errors: EntryFormErrors = {};

  if (!data.projectId) {
    errors.projectId = "Please select a project";
  }

  if (!data.date) {
    errors.date = "Date is required";
  }

  const hours = parseFloat(data.hours);
  if (isNaN(hours) || hours <= 0) {
    errors.hours = "Hours must be greater than zero";
  } else if (hours > 24) {
    errors.hours = "Hours cannot exceed 24";
  }

  return errors;
}

export function validateEditForm(
  data: EditFormData
): Partial<Record<"hours", string>> {
  const errors: Partial<Record<"hours", string>> = {};

  const hours = parseFloat(data.hours);
  if (isNaN(hours) || hours <= 0) {
    errors.hours = "Hours must be greater than zero";
  } else if (hours > 24) {
    errors.hours = "Hours cannot exceed 24";
  }

  return errors;
}
