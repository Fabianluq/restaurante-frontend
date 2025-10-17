export interface RequestParams {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
  skipAuth?: boolean;
}
