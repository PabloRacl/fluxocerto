/**
 * Classe base para todos os erros mapeados da API.
 */
export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    
    // Mantém o stack trace limpo no V8 (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Erro 404 - Registro não encontrado
 */
export class NotFoundError extends ApiError {
  constructor(message: string = "Registro não encontrado") {
    super(message, 404);
  }
}

/**
 * Erro 400 - Requisição mal formulada ou regra de negócio violada
 */
export class BadRequestError extends ApiError {
  constructor(message: string = "Requisição inválida") {
    super(message, 400);
  }
}

/**
 * Erro 403 - Usuário autenticado não tem permissão de acessar este recurso
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = "Acesso negado a este recurso") {
    super(message, 403);
  }
}

/**
 * Erro 409 - Conflito (ex: registro duplicado)
 */
export class ConflictError extends ApiError {
  constructor(message: string = "Conflito de dados") {
    super(message, 409);
  }
}
