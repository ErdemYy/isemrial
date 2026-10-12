export class ApiError extends Error {
  statusCode: number;
  errorType?: string;

  constructor(message: string, statusCode: number, errorType?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorType = errorType;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const response = await fetch(endpoint, {
    ...options,
    credentials: "include", // Send and receive HttpOnly session cookie
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let errorMsg = `Sunucu hatası (${response.status})`;
    if (data?.message) {
      if (Array.isArray(data.message)) {
        errorMsg = data.message.join(", ");
      } else if (typeof data.message === "string") {
        errorMsg = data.message;
      }
    }
    throw new ApiError(errorMsg, response.status, data?.error);
  }

  return (data?.data !== undefined ? data.data : data) as T;
}
