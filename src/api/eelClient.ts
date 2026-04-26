import type { EelResponse } from '../types/api.types';
import { logger } from '../utils/logger';

type EelMethodFactory<TArgs extends unknown[], TResult> = (...args: TArgs) => () => Promise<TResult>;

export const isEelAvailable = (): boolean => Boolean((window as Window & { eel?: unknown }).eel);

export async function callEel<TArgs extends unknown[], TResult>(
  methodName: string,
  ...args: TArgs
): Promise<TResult> {
  const eel = (window as unknown as Window & { eel?: Record<string, unknown> }).eel;
  if (!eel) {
    const error = new Error('Eel bridge is unavailable.');
    logger.error({ error: { type: error.name, message: error.message } }, 'Eel bridge unavailable');
    throw error;
  }

  const factory = eel[methodName] as EelMethodFactory<TArgs, TResult> | undefined;
  if (typeof factory !== 'function') {
    const error = new Error(`Eel method "${methodName}" is not available.`);
    logger.error({ error: { type: error.name, message: error.message }, methodName }, 'Eel method not available');
    throw error;
  }

  logger.debug({ methodName }, `Calling Eel method`);
  try {
    const result = await factory(...args)();
    return result;
  } catch (error: any) {
    logger.error({ error: { type: error?.name || 'Error', message: error?.message || String(error) }, methodName }, `Eel method failed`);
    throw error;
  }
}
