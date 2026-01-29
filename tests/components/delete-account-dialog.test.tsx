import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";

// Mock server action
vi.mock("@/app/actions/account", () => ({
  deleteAccount: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("DeleteAccountDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders danger zone card", () => {
    render(<DeleteAccountDialog />);

    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete account/i })).toBeInTheDocument();
  });

  it("opens confirmation dialog when delete button clicked", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountDialog />);

    await user.click(screen.getByRole("button", { name: /delete account/i }));

    expect(screen.getByText(/permanent/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type 'delete' to confirm/i)).toBeInTheDocument();
  });

  it("delete action button is disabled until 'delete' is typed", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountDialog />);

    await user.click(screen.getByRole("button", { name: /delete account/i }));

    // The action button inside the dialog
    const actionButtons = screen.getAllByRole("button", { name: /delete account/i });
    const confirmButton = actionButtons[actionButtons.length - 1];
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/type 'delete' to confirm/i), "delete");

    expect(confirmButton).not.toBeDisabled();
  });
});
