import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { deleteAccount } from "@/app/actions/account";

const mockPush = vi.fn();

// Mock server action
vi.mock("@/app/actions/account", () => ({
  deleteAccount: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
}));

describe("DeleteAccountDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
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

  it("calls deleteAccount and redirects on successful deletion", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountDialog />);

    // Open dialog
    await user.click(screen.getByRole("button", { name: /delete account/i }));

    // Type confirmation
    await user.type(screen.getByPlaceholderText(/type 'delete' to confirm/i), "delete");

    // Click confirm button
    const actionButtons = screen.getAllByRole("button", { name: /delete account/i });
    const confirmButton = actionButtons[actionButtons.length - 1];
    await user.click(confirmButton);

    // Verify deleteAccount was called
    await waitFor(() => {
      expect(deleteAccount).toHaveBeenCalled();
    });

    // Verify redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("clears confirmation text when dialog is closed", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountDialog />);

    // Open dialog
    await user.click(screen.getByRole("button", { name: /delete account/i }));

    // Type some text
    const input = screen.getByPlaceholderText(/type 'delete' to confirm/i);
    await user.type(input, "del");

    // Close dialog by clicking cancel
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    // Re-open dialog
    await user.click(screen.getByRole("button", { name: /delete account/i }));

    // Verify input is cleared
    const newInput = screen.getByPlaceholderText(/type 'delete' to confirm/i);
    expect(newInput).toHaveValue("");
  });
});
