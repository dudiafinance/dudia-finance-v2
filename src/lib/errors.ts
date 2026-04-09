export type FinancialErrorCode = 
  | "INSUFFICIENT_FUNDS" 
  | "LIMIT_EXCEEDED" 
  | "ENTITY_NOT_FOUND" 
  | "UNAUTHORIZED" 
  | "VALIDATION_ERROR" 
  | "INTERNAL_ERROR";

export class FinancialError extends Error {
  public code: FinancialErrorCode;
  public status: number;
  public data?: any;

  constructor(message: string, code: FinancialErrorCode = "INTERNAL_ERROR", status: number = 400, data?: any) {
    super(message);
    this.name = "FinancialError";
    this.code = code;
    this.status = status;
    this.data = data;
  }

  static insufficientFunds(available: number, required: number) {
    return new FinancialError(
      `Saldo insuficiente. Disponível: ${available.toFixed(2)}, Necessário: ${required.toFixed(2)}`,
      "INSUFFICIENT_FUNDS",
      400,
      { available, required }
    );
  }

  static notFound(entity: string) {
    return new FinancialError(`${entity} não encontrado(a).`, "ENTITY_NOT_FOUND", 404);
  }

  static limitExceeded(limit: number, current: number) {
    return new FinancialError(
      `Limite de crédito excedido. Limite: ${limit.toFixed(2)}, Utilizado: ${current.toFixed(2)}`,
      "LIMIT_EXCEEDED",
      400,
      { limit, current }
    );
  }
}
