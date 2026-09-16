import axios from "./axios";

export async function executeCode(language, code, token) {
  try {
    const response = await axios.post(
      "/execute",
      {
        language,
        code,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Failed to execute code";

    return {
      success: false,
      error: message,
    };
  }
}
