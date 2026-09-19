import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateExpenseModal from './CreateExpenseModal';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CreateExpenseModal Component', () => {
  const mockMembers = [
    { userId: 1, username: 'alice', email: 'alice@example.com', role: 'OWNER' },
    { userId: 2, username: 'bob', email: 'bob@example.com', role: 'COLLABORATOR' },
    { userId: 3, username: 'charlie', email: 'charlie@example.com', role: 'COLLABORATOR' },
  ];

  const mockTrip = {
    id: 10,
    title: 'Paris Holiday',
    startDate: '2026-06-01',
    endDate: '2026-06-15',
    user: { id: 1, username: 'alice' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: mockMembers });
    api.post.mockResolvedValue({ data: { id: 99, title: 'Dinner' } });
  });

  it('renders modal inputs and loads trip members with checkboxes pre-selected', async () => {
    render(
      <CreateExpenseModal
        isOpen={true}
        onClose={vi.fn()}
        tripId={10}
        trip={mockTrip}
        onExpenseSaved={vi.fn()}
      />
    );

    expect(screen.getByText('➕ Add New Expense')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Dinner at Olive Garden/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/trips/10/members');
      expect(screen.getByText('alice')).toBeInTheDocument();
      expect(screen.getByText('bob')).toBeInTheDocument();
      expect(screen.getByText('charlie')).toBeInTheDocument();
    });

    // All checkboxes should be pre-selected by default
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(3);
    checkboxes.forEach((cb) => {
      expect(cb).toBeChecked();
    });
  });

  it('calculates dynamic real-time per-head amount preview when amount changes', async () => {
    const user = userEvent.setup();
    render(
      <CreateExpenseModal
        isOpen={true}
        onClose={vi.fn()}
        tripId={10}
        trip={mockTrip}
        onExpenseSaved={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });

    const amountInput = screen.getByPlaceholderText('0.00');
    await user.type(amountInput, '999');

    // 999 split among 3 members = 333.00 per person
    await waitFor(() => {
      expect(screen.getByText(/₹333.00 per person/)).toBeInTheDocument();
      expect(screen.getByText(/Split equally among 3 members/)).toBeInTheDocument();
    });
  });

  it('updates dynamic split amount when a member checkbox is unselected', async () => {
    const user = userEvent.setup();
    render(
      <CreateExpenseModal
        isOpen={true}
        onClose={vi.fn()}
        tripId={10}
        trip={mockTrip}
        onExpenseSaved={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });

    const amountInput = screen.getByPlaceholderText('0.00');
    await user.type(amountInput, '1000');

    // Unselect third member (charlie)
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[2]);

    // 1000 split among 2 members = 500.00 per person
    await waitFor(() => {
      expect(screen.getByText(/₹500.00 per person/)).toBeInTheDocument();
      expect(screen.getByText(/Split equally among 2 members/)).toBeInTheDocument();
    });
  });

  it('submits POST /expenses with splitUserIds included in payload', async () => {
    const user = userEvent.setup();
    const mockOnExpenseSaved = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <CreateExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        tripId={10}
        trip={mockTrip}
        onExpenseSaved={mockOnExpenseSaved}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText(/e.g. Dinner at Olive Garden/i);
    const amountInput = screen.getByPlaceholderText('0.00');

    await user.type(titleInput, 'River Cruise');
    await user.type(amountInput, '1500');

    const submitBtn = screen.getByRole('button', { name: /Add Expense/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/expenses', expect.objectContaining({
        title: 'River Cruise',
        amount: 1500,
        tripId: 10,
        splitUserIds: [1, 2, 3],
      }));
      expect(mockOnExpenseSaved).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
