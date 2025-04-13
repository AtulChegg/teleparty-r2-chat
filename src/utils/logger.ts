const isDebugMode =
  process.env.REACT_APP_DEBUG === "true" ||
  process.env.NODE_ENV === "development";

export type LogLevel = "info" | "warn" | "error" | "debug";

interface LoggerOptions {
  module: string;
  enabled?: boolean;
}

class Logger {
  private module: string;
  private enabled: boolean;

  constructor(options: LoggerOptions) {
    this.module = options.module;
    this.enabled =
      options.enabled !== undefined ? options.enabled : isDebugMode;
  }

  private formatMessage(level: LogLevel, message: string): string {
    return `[${this.module}] [${level.toUpperCase()}] ${message}`;
  }

  info(message: string, ...args: any[]): void {
    if (!this.enabled) return;
    console.log(this.formatMessage("info", message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    if (!this.enabled) return;
    console.warn(this.formatMessage("warn", message), ...args);
  }

  error(message: string, ...args: any[]): void {
    if (!this.enabled) return;
    console.error(this.formatMessage("error", message), ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (!this.enabled) return;
    console.debug(this.formatMessage("debug", message), ...args);
  }

  // Create a trace with timing information
  trace(message: string, callback: () => any): any {
    if (!this.enabled) return callback();

    const start = performance.now();
    this.debug(`TRACE START: ${message}`);

    try {
      return callback();
    } finally {
      const duration = performance.now() - start;
      this.debug(`TRACE END: ${message} (${duration.toFixed(2)}ms)`);
    }
  }
}

export function createLogger(module: string, enabled?: boolean): Logger {
  return new Logger({ module, enabled });
}
