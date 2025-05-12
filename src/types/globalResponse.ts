export interface GlobalResponse<T> {
    responseData: T[];
    message: string;
    success: boolean;
    violations: string | string[] | null;
    timestamp: string;
    path: string;
  }