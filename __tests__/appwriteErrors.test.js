const {
  classifyAppwriteError,
  isBackendUnavailable,
} = require("../utils/appwriteErrors");

// Shapes mirror react-native-appwrite's AppwriteException:
// { message, code, type, response }. Network failures surface as a plain
// TypeError from fetch with no `code`.
const ex = (code, type, message = "") => ({ code, type, message });

describe("classifyAppwriteError", () => {
  test("paused project (Free-plan inactivity) → paused", () => {
    expect(
      classifyAppwriteError(
        ex(403, "project_paused", "Project is paused due to inactivity."),
      ),
    ).toBe("paused");
    expect(classifyAppwriteError(ex(403, "general_resource_blocked"))).toBe(
      "paused",
    );
    // Fuzzy fallback in case Cloud renames the type.
    expect(
      classifyAppwriteError(
        ex(
          403,
          "general_project_paused",
          "Project is paused due to inactivity",
        ),
      ),
    ).toBe("paused");
    expect(
      classifyAppwriteError(ex(403, "", "Project is paused. Restore it.")),
    ).toBe("paused");
  });

  test("no session / expired session → unauthorized (a real sign-out)", () => {
    expect(
      classifyAppwriteError(
        ex(
          401,
          "general_unauthorized_scope",
          "User (role: guests) missing scope",
        ),
      ),
    ).toBe("unauthorized");
    expect(classifyAppwriteError(ex(401, "user_unauthorized"))).toBe(
      "unauthorized",
    );
    expect(classifyAppwriteError(ex(404, "user_session_not_found"))).toBe(
      "unauthorized",
    );
  });

  test("5xx / 429 / 503 → server", () => {
    expect(classifyAppwriteError(ex(500, "general_unknown"))).toBe("server");
    expect(classifyAppwriteError(ex(503, "general_service_disabled"))).toBe(
      "server",
    );
    expect(classifyAppwriteError(ex(429, "general_rate_limit_exceeded"))).toBe(
      "server",
    );
  });

  test("fetch-level failures (no code) → network", () => {
    expect(classifyAppwriteError(new TypeError("Network request failed"))).toBe(
      "network",
    );
    expect(classifyAppwriteError(new Error("Failed to fetch"))).toBe("network");
    expect(classifyAppwriteError({ code: 0, message: "timeout" })).toBe(
      "network",
    );
    expect(
      classifyAppwriteError({ name: "AbortError", message: "Aborted" }),
    ).toBe("network");
    // react-native-appwrite wraps transport failures as
    // AppwriteException(message) with code 0 and type "" — must be network
    // regardless of the message text.
    expect(
      classifyAppwriteError({
        name: "AppwriteException",
        code: 0,
        type: "",
        message: "some future message",
      }),
    ).toBe("network");
  });

  test("anything else → unknown, and never throws on junk", () => {
    expect(classifyAppwriteError(ex(400, "general_argument_invalid"))).toBe(
      "unknown",
    );
    expect(classifyAppwriteError(ex(403, "document_invalid_permissions"))).toBe(
      "unknown",
    );
    expect(classifyAppwriteError(null)).toBe("unknown");
    expect(classifyAppwriteError(undefined)).toBe("unknown");
    expect(classifyAppwriteError("string error")).toBe("unknown");
  });
});

describe("isBackendUnavailable", () => {
  test("paused, network and server mean 'the backend is down, not the user'", () => {
    expect(isBackendUnavailable("paused")).toBe(true);
    expect(isBackendUnavailable("network")).toBe(true);
    expect(isBackendUnavailable("server")).toBe(true);
  });
  test("unauthorized and unknown are not outages", () => {
    expect(isBackendUnavailable("unauthorized")).toBe(false);
    expect(isBackendUnavailable("unknown")).toBe(false);
    expect(isBackendUnavailable(null)).toBe(false);
  });
});
