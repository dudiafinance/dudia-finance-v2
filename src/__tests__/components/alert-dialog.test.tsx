import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlertDialog } from "@/components/ui/alert-dialog";

describe("AlertDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: "Test Title",
    description: "Test description text",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "danger" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open is true", () => {
    render(<AlertDialog {...defaultProps} />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test description text")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<AlertDialog {...defaultProps} open={false} />);

    expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
  });

  it("calls onClose when Cancel button is clicked", () => {
    render(<AlertDialog {...defaultProps} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Confirm button is clicked", () => {
    render(<AlertDialog {...defaultProps} />);

    const confirmButton = screen.getByText("Confirm");
    fireEvent.click(confirmButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking on backdrop", () => {
    render(<AlertDialog {...defaultProps} />);

    const backdrop = document.querySelector(".absolute.inset-0");
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("renders danger variant correctly", () => {
    render(<AlertDialog {...defaultProps} variant="danger" />);

    const confirmButton = screen.getByText("Confirm");
    expect(confirmButton).toBeInTheDocument();
  });

  it("renders warning variant correctly", () => {
    render(<AlertDialog {...defaultProps} variant="warning" />);

    const confirmButton = screen.getByText("Confirm");
    expect(confirmButton).toBeInTheDocument();
  });

  it("renders default variant correctly", () => {
    render(<AlertDialog {...defaultProps} variant="default" />);

    const confirmButton = screen.getByText("Confirm");
    expect(confirmButton).toBeInTheDocument();
  });

  it("disables buttons when isLoading is true", () => {
    render(<AlertDialog {...defaultProps} isLoading={true} />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it("shows loading spinner when isLoading is true", () => {
    render(<AlertDialog {...defaultProps} isLoading={true} />);

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders without description", () => {
    render(
      <AlertDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Title Only"
      />
    );

    expect(screen.getByText("Title Only")).toBeInTheDocument();
  });

  it("uses default confirm and cancel text", () => {
    render(
      <AlertDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Test"
      />
    );

    expect(screen.getByText("Confirmar")).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });

  it("closes on Escape key press", () => {
    render(<AlertDialog {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
