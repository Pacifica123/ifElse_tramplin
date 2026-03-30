import { AxiosError } from 'axios';

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.message ??
      error.message ??
      'Произошла неизвестная ошибка'
    );
  }

  if (error instanceof Error) return error.message;
  return 'Произошла неизвестная ошибка';
}
