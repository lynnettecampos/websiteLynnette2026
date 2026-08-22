const collectValidationMessages = (error: unknown): string[] => {
  if (!error || typeof error !== "object") {
    return [];
  }

  const { formErrors, fieldErrors } = error as {
    formErrors?: unknown;
    fieldErrors?: Record<string, unknown>;
  };

  const messages: string[] = [];

  if (Array.isArray(formErrors)) {
    messages.push(...formErrors.filter((message): message is string => typeof message === "string"));
  }

  if (fieldErrors && typeof fieldErrors === "object") {
    Object.entries(fieldErrors).forEach(([field, fieldMessages]) => {
      if (!Array.isArray(fieldMessages)) {
        return;
      }

      fieldMessages.forEach((message) => {
        if (typeof message === "string" && message.trim().length > 0) {
          messages.push(`${field}: ${message}`);
        }
      });
    });
  }

  return Array.from(new Set(messages));
};

export const extractApiErrorMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const { error } = payload as { error?: unknown };

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (typeof error === "number" || typeof error === "boolean") {
    return String(error);
  }

  const validationMessages = collectValidationMessages(error);

  if (validationMessages.length > 0) {
    return validationMessages.join(". ");
  }

  if (typeof error === "object" && error !== null) {
    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") {
        return serialized;
      }
    } catch {
      // Ignore JSON serialization failures.
    }
  }

  return fallback;
};
