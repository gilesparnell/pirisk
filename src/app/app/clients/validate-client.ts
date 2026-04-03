export type ClientFormData = {
  name: string;
  rateType: string;
  rate: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
};

export type ClientFormErrors = Partial<Record<"name" | "rate", string>>;

export function validateClientForm(data: ClientFormData): ClientFormErrors {
  const errors: ClientFormErrors = {};

  if (!data.name.trim()) {
    errors.name = "Client name is required";
  }

  const rate = parseFloat(data.rate);
  if (isNaN(rate)) {
    errors.rate = "Rate must be a valid number";
  } else if (rate <= 0) {
    errors.rate = "Rate must be greater than zero";
  }

  return errors;
}
