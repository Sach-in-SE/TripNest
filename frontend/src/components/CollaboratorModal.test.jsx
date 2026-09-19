import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CollaboratorModal from './CollaboratorModal';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CollaboratorModal Component', () => {
  const mockShares = [
    {
      id: 1,
      tripId: 42,
      sharedWithUserId: 101,
      sharedWithUsername: 'alice',
      sharedWithEmail: 'alice@example.com',
      permission: 'VIEW',
      status: 'ACCEPTED',
    },
    {
      id: 2,
      tripId: 42,
      sharedWithUserId: 102,
      sharedWithUsername: 'bob',
      sharedWithEmail: 'bob@example.com',
      permission: 'EDIT',
      status: 'PENDING',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: mockShares });
  });

  it('renders trip title, email input, access levels, and existing collaborators', async () => {
    render(
      <CollaboratorModal
        tripId={42}
        tripTitle="Goa Getaway"
        canManageShares={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Share & Collaborate 🤝')).toBeInTheDocument();
    expect(screen.getByText(/Goa Getaway/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('friend@example.com')).toBeInTheDocument();
    expect(screen.getByText('Viewer')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText(/Add to Group Discussion \/ Chat\?/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
      expect(screen.getByText('bob')).toBeInTheDocument();
      expect(screen.getByText('✓ Accepted')).toBeInTheDocument();
      expect(screen.getByText('⏳ Pending')).toBeInTheDocument();
    });
  });

  it('submits invitation with selected email, permission, and group toggle', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    api.post.mockResolvedValue({ data: { message: 'Invitation sent' } });

    render(
      <CollaboratorModal
        tripId={42}
        tripTitle="Goa Getaway"
        defaultAddToGroup={true}
        onClose={vi.fn()}
        onSuccess={handleSuccess}
      />
    );

    const emailInput = screen.getByPlaceholderText('friend@example.com');
    await user.type(emailInput, 'charlie@example.com');

    // Select Editor permission
    const editorCard = screen.getByText('Editor');
    await user.click(editorCard);

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Send Invitation/i });
    await user.click(submitBtn);

    expect(api.post).toHaveBeenCalledWith('/trip-shares/invite', {
      tripId: 42,
      email: 'charlie@example.com',
      permission: 'EDIT',
      addToGroup: true,
    });

    await waitFor(() => {
      expect(screen.getByText(/Invitation sent to charlie@example.com!/)).toBeInTheDocument();
      expect(handleSuccess).toHaveBeenCalled();
    });
  });

  it('updates collaborator permission', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValue({ data: { message: 'Updated' } });

    render(
      <CollaboratorModal
        tripId={42}
        canManageShares={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });

    // Find the select for alice (current value VIEW)
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'EDIT');

    expect(api.put).toHaveBeenCalledWith('/trip-shares/trip/42/user/101/permission', {
      tripPermission: 'EDIT',
    });
  });

  it('removes collaborator access when confirmed', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.delete.mockResolvedValue({ data: { message: 'Deleted' } });

    render(
      <CollaboratorModal
        tripId={42}
        canManageShares={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });

    const removeBtns = screen.getAllByTitle('Remove access');
    await user.click(removeBtns[0]);

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('alice'));
    expect(api.delete).toHaveBeenCalledWith('/trip-shares/trip/42/user/101');
  });

  it('closes modal on close button click and escape key', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <CollaboratorModal
        tripId={42}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Close dialog/i });
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
