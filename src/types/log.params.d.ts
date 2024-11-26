export type LogParamsType = {
  className: string;
  functionName: string;
  message: string;
  error?: string | Error;
  context?: Record<string, any>;
};
