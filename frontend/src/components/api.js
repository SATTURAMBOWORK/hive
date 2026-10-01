import { API_BASE_URL } from "./config";
import { emitToast } from "./toast-bus";
import { emitAuthExpired } from "./auth-bus";

function defaultSuccessMessage(method) {
  if (method === "DELETE") return "Deleted successfully.";
  if (method === "PATCH" || method === "PUT") return "Updated successfully.";
  if (method === "POST") return "Saved successfully.";
  return "Completed successfully.";
}

export async function apiRequest(
  path,
  {
    method = "GET",
    token,
    body,
    formData,
    notifySuccess,
    notifyError = true,
    successMessage,
    errorMessage,
  } = {}
) {
  const isMultipart = formData instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(isMultipart ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: isMultipart ? formData : body ? JSON.stringify(body) : undefined
  });

  const responseData = await response.json().catch(() => ({}));

  // 401 on a request that carried a token = session expired or invalid.
  // (A 401 without a token, e.g. wrong password on login, is a normal error.)
  if (response.status === 401 && token) {
    emitAuthExpired();
    throw new Error(responseData.message || "Session expired");
  }

  if (!response.ok) {
    const message = errorMessage || responseData.message || "Request failed";
    if (notifyError) {
      emitToast("error", message);
    }
    throw new Error(message);
  }

  const shouldNotifySuccess =
    typeof notifySuccess === "boolean" ? notifySuccess : method !== "GET";

  if (shouldNotifySuccess) {
    const message = successMessage || responseData.message || defaultSuccessMessage(method);
    emitToast("success", message);
  }

  return responseData;
}
