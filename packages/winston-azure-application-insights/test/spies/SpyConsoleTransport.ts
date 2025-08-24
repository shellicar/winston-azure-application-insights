import { beforeEach } from 'vitest';
import * as winston from 'winston';

type LogDelegate = (...data: any[]) => void;

export class SpyConsoleTransport extends winston.transports.Console {
  public capturedOutput: string[] = [];
  private readonly _consoleLog: LogDelegate;
  private readonly _consoleWarn: LogDelegate;
  private readonly _consoleError: LogDelegate;

  constructor(options: winston.transports.ConsoleTransportOptions = {}) {
    super({
      ...options,
      forceConsole: true,
    });

    beforeEach(() => {
      this.clear();
    });

    this._consoleLog = this.captureMessage.bind(this);
    this._consoleWarn = this.captureMessage.bind(this);
    this._consoleError = this.captureMessage.bind(this);
  }

  override log(info: any, next: () => void) {
    super.log?.(info, next);
  }

  private captureMessage(message: string): void {
    console.log('CAPTURED:', message);
    this.capturedOutput.push(message);
  }

  get lastOutput(): string | undefined {
    return this.capturedOutput[this.capturedOutput.length - 1];
  }

  clear(): void {
    this.capturedOutput = [];
  }
}
