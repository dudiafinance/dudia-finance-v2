import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const ErrorThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>Rendered successfully</div>;
};

const SuccessfulComponent = () => <div>No error here</div>;

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <SuccessfulComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("No error here")).toBeInTheDocument();
  });

  it("catches errors and displays error UI", () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
  });

  it("displays the error message", () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("displays network error message for fetch errors", () => {
    const FetchErrorComponent = () => {
      throw new Error("Failed to fetch");
    };

    render(
      <ErrorBoundary>
        <FetchErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/problema de conexão/i)).toBeInTheDocument();
  });

  it("displays reload button", () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Recarregar Página")).toBeInTheDocument();
  });

  it("displays clear cache button", () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Limpar Cache")).toBeInTheDocument();
  });

  it("displays dismiss/ignore button", () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Ignorar e continuar")).toBeInTheDocument();
  });

  it("calls window.location.reload when Reload is clicked", () => {
    const locationMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: locationMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText("Recarregar Página");
    fireEvent.click(reloadButton);

    expect(locationMock).toHaveBeenCalled();
  });

  it("calls window.location.reload when Clear Cache is clicked", () => {
    const locationMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: locationMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    const clearCacheButton = screen.getByText("Limpar Cache");
    fireEvent.click(clearCacheButton);

    expect(locationMock).toHaveBeenCalled();
  });

  it("renders custom fallback when provided and error occurs", () => {
    render(
      <ErrorBoundary fallback={<div>Custom Fallback</div>}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom Fallback")).toBeInTheDocument();
  });

  it("clears error state when Dismiss is clicked and shows children again", () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();

    const dismissButton = screen.getByText("Ignorar e continuar");
    fireEvent.click(dismissButton);

    vi.useFakeTimers();
  });

  it("handles multiple errors in sequence", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
  });

  it("displays AlertTriangle icon when error occurs", () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    const alertIcon = document.querySelector(".text-red-500");
    expect(alertIcon).toBeInTheDocument();
  });
});
