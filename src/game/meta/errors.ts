/**
 * Soft-launch error reporting stub (G6).
 * Buffers exceptions for later wiring to a real reporter.
 */

export interface ErrorReport {
  message: string;
  stack?: string;
  source: string;
  client_ts: number;
}

const reports: ErrorReport[] = [];

export function reportError(
  error: unknown,
  source = "unknown",
): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error";
  const stack = error instanceof Error ? error.stack : undefined;
  const entry: ErrorReport = {
    message,
    stack,
    source,
    client_ts: Date.now(),
  };
  reports.push(entry);
  if (reports.length > 50) reports.shift();
  console.error("[error]", source, message);
}

export function getErrorReports(): readonly ErrorReport[] {
  return reports;
}

export function clearErrorReports(): void {
  reports.length = 0;
}

export function installGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (ev) => {
    reportError(ev.error ?? ev.message, "window.error");
  });
  window.addEventListener("unhandledrejection", (ev) => {
    reportError(ev.reason, "unhandledrejection");
  });
}
