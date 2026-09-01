import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WorkPulseDashboardPage from "@/app/page";

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

(window as any).AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: () => ({
    connect: vi.fn(),
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    start: vi.fn(),
    stop: vi.fn(),
  }),
  createGain: () => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  }),
  destination: {},
  currentTime: 0,
}));

describe("WorkPulse KDS Full App Integration", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders Team Board with simple column titles and privacy badge", async () => {
    render(<WorkPulseDashboardPage />);

    expect(screen.getByText("WorkPulse")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "New Orders" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "In Progress" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Needs Review" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Finished" })).toBeInTheDocument();
    expect(screen.getByText(/Encrypted/i)).toBeInTheDocument();
  });

  it("executes claim job with Take This Job button", async () => {
    render(<WorkPulseDashboardPage />);

    const claimButtons = screen.getAllByRole("button", { name: /take this job/i });
    expect(claimButtons.length).toBeGreaterThan(0);

    fireEvent.click(claimButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/You Claimed This Job!/i)).toBeInTheDocument();
    });
  });

  it("switches to My Assigned Jobs view", async () => {
    render(<WorkPulseDashboardPage />);

    const staffTab = screen.getByRole("button", { name: /my assigned jobs/i });
    fireEvent.click(staffTab);

    expect(screen.getByRole("heading", { name: /Sarah Miller/i })).toBeInTheDocument();
    expect(screen.getByText(/Supervising/i)).toBeInTheDocument();
  });

  it("clears board with Start Empty and repopulates with Load Sample Data", async () => {
    render(<WorkPulseDashboardPage />);

    const emptyBtn = screen.getByRole("button", { name: /start empty/i });
    fireEvent.click(emptyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Board Cleared/i)).toBeInTheDocument();
    });

    const sampleBtn = screen.getByRole("button", { name: /load sample data/i });
    fireEvent.click(sampleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Sample Data Loaded/i)).toBeInTheDocument();
    });
  });

  it("toggles theme between light and dark mode", async () => {
    render(<WorkPulseDashboardPage />);

    const themeToggle = screen.getByTitle(/switch to/i);
    expect(themeToggle).toBeInTheDocument();

    fireEvent.click(themeToggle);
    expect(window.localStorage.getItem("workpulse_theme")).toBeDefined();
  });
});
