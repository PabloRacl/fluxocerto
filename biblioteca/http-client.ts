/**
 * Cliente HTTP unificado para o Frontend.
 * Abstrai a verbosidade do `fetch`, injeta os headers de credenciais (NextAuth) 
 * por padrão, e já trata de parsear e disparar erros estruturados caso a 
 * API não retorne status OK (ex: 400 Bad Request / 404 Not Found).
 */

type FetchOptions = RequestInit & {
  params?: Record<string, string | number | boolean>;
};

export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;

  let url = endpoint;
  
  // Constrói Query Strings nativamente se params for passado
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url = `${endpoint}?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    // Credentials true informa ao NextAuth para trafegar o Session Cookie
    credentials: "include",
    ...rest,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      data?.error || "Ocorreu um erro inesperado na requisição.",
      data?.detalhes || data
    );
  }

  // Desempacota envelopes comuns sem quebrar respostas antigas.
  // - { ok: true, data: ... }
  // - { success: true, data: ... }
  if (data && typeof data === "object") {
    if ("ok" in data) return (data as any).data;
    if ("success" in data) return (data as any).data;
  }
  return data;
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) => 
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data: any, options?: FetchOptions) => 
    request<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(data) }),

  put: <T>(endpoint: string, data: any, options?: FetchOptions) => 
    request<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(data) }),

  patch: <T>(endpoint: string, data?: any, options?: FetchOptions) => 
    request<T>(endpoint, { ...options, method: "PATCH", body: data ? JSON.stringify(data) : undefined }),

  delete: <T>(endpoint: string, options?: FetchOptions) => 
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
