export class CommandResult<E = never> {
  private readonly value?: unknown;
  private readonly error?: E;
  private readonly _isSuccess: boolean;

  private constructor(isSuccess: boolean, value?: unknown, error?: E) {
    this._isSuccess = isSuccess;
    this.value = value;
    this.error = error;
  }

  static success<E = never>(value?: unknown): CommandResult<E> {
    return new CommandResult<E>(true, value);
  }

  static failure<E>(error: E): CommandResult<E> {
    return new CommandResult<E>(false, undefined, error);
  }

  isSuccess(): boolean {
    return this._isSuccess;
  }

  isFailure(): boolean {
    return !this._isSuccess;
  }

  getValue<T>(): T {
    return this.value as T;
  }

  getError(): E {
    return this.error as E;
  }
}
