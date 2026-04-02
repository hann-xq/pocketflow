const BASE_URL = process.env.EXPO_PUBLIC_API;

type RequestOptions = Omit<RequestInit, "method" | "body">;
type QueryParams = Record<string, string | number | boolean | undefined>;

class API {
  private token: string | null = null;


  applyToken(token: string | null) {
    this.token = token;
  }

  private getHeaders(customHeaders?: HeadersInit, isFormData = false): HeadersInit {
    const headers = new Headers(customHeaders);

    if (!isFormData) {
        headers.set("Content-Type", "application/json");
    }

    if (this.token) {
        headers.set("Authorization", `Bearer ${this.token}`);
    }

    return headers;
  } 

  /**
   * Build full URL with optional query parameters.
   *
   * Example:
   * buildUrl('/users', { page: 1 }) → /users?page=1
   */
  private buildUrl(path: string, params?: QueryParams): string {
    const url = new URL(`${BASE_URL}/api/v1${path}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Generic request handler used by all HTTP methods.
   *
   * Handles:
   * - JSON & FormData bodies
   * - Query params
   * - Error parsing
   * - Empty responses
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: QueryParams,
    options?: RequestOptions
  ): Promise<T> {
    const isFormData = body instanceof FormData;

    const response = await fetch(this.buildUrl(path, params), {
      ...options,
      method,
      headers: this.getHeaders(options?.headers, isFormData),
      body:
        body === undefined
          ? undefined
          : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw {
        status: response.status,
        message: data?.message || response.statusText,
        error: data?.error,
      };
    }

    return data as T;
  }

  /**
   * HTTP helper methods
   */

  get<T>(path: string, params?: QueryParams, options?: RequestOptions) {
    return this.request<T>("GET", path, undefined, params, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("POST", path, body, undefined, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("PUT", path, body, undefined, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("PATCH", path, body, undefined, options);
  }

  delete<T>(path: string, params?: QueryParams, options?: RequestOptions) {
    return this.request<T>("DELETE", path, undefined, params, options);
  }

  async abnAmroAuthCallback(code: string, state: string | null): Promise<void> {
    const url = new URL(`${BASE_URL}/auth`);
    url.searchParams.set("code", code);
    if (state) url.searchParams.set("state", state);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      throw {
        status: response.status,
        message: data?.message || response.statusText,
      };
    }
  }

}

export const api = new API();