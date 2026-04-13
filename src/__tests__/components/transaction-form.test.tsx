import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TransactionForm } from "@/components/features/transactions/transaction-form";

vi.mock("@/hooks/use-api", () => ({
  useCreateTransaction: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
  useUpdateTransaction: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
  useDeleteTransaction: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

const defaultProps = {
  categories: [
    { id: "1", name: "Alimentação", type: "expense" },
    { id: "2", name: "Salário", type: "income" },
  ],
  accounts: [
    { id: "acc1", name: "Carteira", balance: 1000 },
    { id: "acc2", name: "Banco", balance: 5000 },
  ],
  globalTags: [
    { id: "t1", name: "urgente" },
    { id: "t2", name: "mensal" },
  ],
  userCurrency: "BRL",
  onClose: vi.fn(),
  onSaved: vi.fn(),
};

describe("TransactionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form with all required fields", () => {
    render(<TransactionForm {...defaultProps} />);

    expect(screen.getByPlaceholderText("0,00")).toBeInTheDocument();
    expect(screen.getByText("Descrição Principal")).toBeInTheDocument();
    expect(screen.getByText("Data da Operação")).toBeInTheDocument();
    expect(screen.getByText("Efetivar Lançamento")).toBeInTheDocument();
  });

  it("shows validation error when submitting empty required fields", async () => {
    render(<TransactionForm {...defaultProps} />);

    const submitButton = screen.getByText("Efetivar Lançamento");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Descrição obrigatória/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Valor inválido/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid amount", async () => {
    render(<TransactionForm {...defaultProps} />);

    const amountInput = screen.getByPlaceholderText("0,00");
    fireEvent.change(amountInput, { target: { value: "-50" } });

    const submitButton = screen.getByText("Efetivar Lançamento");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Valor inválido")).toBeInTheDocument();
    });
  });

  it("calls onSaved when submitting with valid data", async () => {
    const onSaved = vi.fn();
    const { useCreateTransaction } = await import("@/hooks/use-api");
    const mockMutateAsync = vi.fn().mockResolvedValue({});
    (useCreateTransaction as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    render(<TransactionForm {...defaultProps} onSaved={onSaved} />);

    const amountInput = screen.getByPlaceholderText("0,00");
    fireEvent.change(amountInput, { target: { value: "100.50" } });

    const descInput = screen.getByPlaceholderText("Ex: Assinatura Software");
    fireEvent.change(descInput, { target: { value: "Test Transaction" } });

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2024-01-15" } });

    const submitButton = screen.getByText("Efetivar Lançamento");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it("renders transaction type buttons (expense, income, transfer)", () => {
    render(<TransactionForm {...defaultProps} />);

    expect(screen.getByText("Saída")).toBeInTheDocument();
    expect(screen.getByText("Entrada")).toBeInTheDocument();
    expect(screen.getByText("Transf.")).toBeInTheDocument();
  });

  it("renders recurrence type buttons (Único, Fixo, Parcelas)", () => {
    render(<TransactionForm {...defaultProps} />);

    expect(screen.getByText("Único")).toBeInTheDocument();
    expect(screen.getByText("Fixo")).toBeInTheDocument();
    expect(screen.getByText("Parcelas")).toBeInTheDocument();
  });

  it("calls onClose when Cancel button is clicked", () => {
    const onClose = vi.fn();
    render(<TransactionForm {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByText("Cancelar");
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});
