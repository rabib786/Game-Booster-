export interface EelResponse {
  status: 'success' | 'error';
  message: string;
  details?: string;
}

type EelMethodFactory<TArgs extends unknown[], TResult> = (...args: TArgs) => () => Promise<TResult>;

export const isEelAvailable = (): boolean => Boolean((window as Window & { eel?: unknown }).eel);

export async function callEel<TArgs extends unknown[], TResult>(
  methodName: string,
  ...args: TArgs
): Promise<TResult> {
  const eel = (window as unknown as Window & { eel?: Record<string, unknown> }).eel;
  if (!eel) {
    throw new Error('Eel bridge is unavailable.');
  }

  const factory = eel[methodName] as EelMethodFactory<TArgs, TResult> | undefined;
  if (typeof factory !== 'function') {
    throw new Error(`Eel method "${methodName}" is not available.`);
  }

  return factory(...args)();
}
