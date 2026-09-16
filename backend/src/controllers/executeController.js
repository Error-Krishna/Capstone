const PISTON_API = "http://localhost:2000/api/v2";

const LANGUAGE_VERSIONS = {
  javascript: { language: "javascript", version: "20.11.1" },
  python: { language: "python", version: "3.12.0" },
  java: { language: "java", version: "15.0.2" },
};

const FILE_EXTENSIONS = {
  javascript: "js",
  python: "py",
  java: "java",
};

export async function executeCode(req, res) {
  try {
    const { language, code } = req.body;

    if (!language || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        error: "Language and code are required",
      });
    }

    const languageConfig = LANGUAGE_VERSIONS[language];

    if (!languageConfig) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${language}`,
      });
    }

    const response = await fetch(`${PISTON_API}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: languageConfig.language,
        version: languageConfig.version,
        files: [
          {
            name: `main.${FILE_EXTENSIONS[language]}`,
            content: code,
          },
        ],
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Piston API error:", response.status, data);

      return res.status(response.status).json({
        success: false,
        error: data?.message || `Piston API returned ${response.status}`,
      });
    }

    const output = data?.run?.output || "";
    const stderr = data?.run?.stderr || "";

    if (stderr) {
      return res.status(200).json({
        success: false,
        output,
        error: stderr,
      });
    }

    return res.status(200).json({
      success: true,
      output: output || "No output",
    });
  } catch (error) {
    console.error("Error executing code:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to execute code",
    });
  }
}
