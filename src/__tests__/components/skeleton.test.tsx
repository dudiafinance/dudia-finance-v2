import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton, DashboardSkeleton, ReportsSkeleton } from "@/components/ui/skeleton";

describe("Skeleton", () => {
  it("renders with default className", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders with custom className", () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton?.className).toContain("h-4");
    expect(skeleton?.className).toContain("w-32");
  });
});

describe("DashboardSkeleton", () => {
  it("renders the dashboard skeleton layout", () => {
    const { container } = render(<DashboardSkeleton />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("contains multiple skeleton elements", () => {
    const { container } = render(<DashboardSkeleton />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders without crashing", () => {
    expect(() => render(<DashboardSkeleton />)).not.toThrow();
  });
});

describe("ReportsSkeleton", () => {
  it("renders the reports skeleton layout", () => {
    const { container } = render(<ReportsSkeleton />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("contains multiple skeleton elements", () => {
    const { container } = render(<ReportsSkeleton />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders without crashing", () => {
    expect(() => render(<ReportsSkeleton />)).not.toThrow();
  });
});
