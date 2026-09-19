import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import Badge from './Badge';
import LoadingSpinner from './LoadingSpinner';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState, { ErrorState } from './EmptyState';
import ErrorBoundary from './ErrorBoundary';

describe('Reusable UI Components', () => {
  describe('Button', () => {
    it('renders children, variant, and handles clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button variant="danger" size="lg" onClick={handleClick}>
          Delete Item
        </Button>
      );

      const btn = screen.getByRole('button', { name: 'Delete Item' });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveClass('tn-btn--danger');
      expect(btn).toHaveClass('tn-btn--lg');

      await user.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button and displays spinner when loading=true', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button loading onClick={handleClick}>
          Saving...
        </Button>
      );

      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(btn).toHaveClass('tn-btn--loading');

      await user.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders custom icon when provided', () => {
      render(<Button icon={<span data-testid="test-icon">🚀</span>}>Launch</Button>);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

  describe('Input', () => {
    it('links label with input via htmlFor / id and accepts typing', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Input label="Destination Name" onChange={handleChange} placeholder="e.g. Paris" />);

      const input = screen.getByLabelText('Destination Name');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'destination-name');

      await user.type(input, 'Rome');
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('Rome');
    });

    it('displays error text and error class when error prop is provided', () => {
      render(<Input label="Email" error="Invalid email address format" />);

      const input = screen.getByLabelText('Email');
      expect(input).toHaveClass('tn-input--error');
      expect(screen.getByText('Invalid email address format')).toBeInTheDocument();
    });

    it('displays helperText when no error is present', () => {
      render(<Input label="Username" helperText="Must be unique" />);
      expect(screen.getByText('Must be unique')).toBeInTheDocument();
    });
  });

  describe('Modal', () => {
    it('returns null when isOpen=false', () => {
      render(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>
      );
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('renders modal with title, children, footer and handles close', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Trip Settings"
          footer={<button>Save Changes</button>}
        >
          <p>Configure trip details</p>
        </Modal>
      );

      expect(screen.getByText('Trip Settings')).toBeInTheDocument();
      expect(screen.getByText('Configure trip details')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();

      // Click close button
      const closeBtn = screen.getByLabelText('Close modal');
      await user.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('closes on Escape key press', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(
        <Modal isOpen={true} onClose={handleClose} title="Escape Test">
          Modal body
        </Modal>
      );

      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Card', () => {
    it('renders full card hierarchy with title, description, content, footer', () => {
      render(
        <Card interactive>
          <CardHeader>
            <CardTitle>Summer Vacation</CardTitle>
            <CardDescription>7 days in Hawaii</CardDescription>
          </CardHeader>
          <CardContent>Packing sunglasses and sunscreen.</CardContent>
          <CardFooter>Total: $1,200</CardFooter>
        </Card>
      );

      expect(screen.getByText('Summer Vacation')).toBeInTheDocument();
      expect(screen.getByText('7 days in Hawaii')).toBeInTheDocument();
      expect(screen.getByText('Packing sunglasses and sunscreen.')).toBeInTheDocument();
      expect(screen.getByText('Total: $1,200')).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders with variant class and icon', () => {
      render(
        <Badge variant="success" icon="✓">
          Completed
        </Badge>
      );

      const badge = screen.getByText('Completed').closest('.tn-badge');
      expect(badge).toHaveClass('tn-badge--success');
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  describe('LoadingSpinner & LoadingSkeleton', () => {
    it('LoadingSpinner has accessible role status and custom message', () => {
      render(<LoadingSpinner message="Fetching destinations..." fullScreen />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Fetching destinations...')).toBeInTheDocument();
    });

    it('LoadingSkeleton renders requested count of skeleton items', () => {
      const { container } = render(<LoadingSkeleton count={3} height="30px" />);
      const skeletons = container.querySelectorAll('.tn-skeleton');
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('EmptyState & ErrorState', () => {
    it('EmptyState renders icon, title, description, and action button', async () => {
      const user = userEvent.setup();
      const handleAction = vi.fn();

      render(
        <EmptyState
          icon="🎒"
          title="No Trips Found"
          description="Start by creating your first trip."
          action={<button onClick={handleAction}>+ Create Trip</button>}
        />
      );

      expect(screen.getByText('🎒')).toBeInTheDocument();
      expect(screen.getByText('No Trips Found')).toBeInTheDocument();
      expect(screen.getByText('Start by creating your first trip.')).toBeInTheDocument();

      await user.click(screen.getByText('+ Create Trip'));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('ErrorState renders error title and fallback description', () => {
      render(<ErrorState title="Failed to load expenses" description="Database connection timed out" />);

      expect(screen.getByText('⚠️')).toBeInTheDocument();
      expect(screen.getByText('Failed to load expenses')).toBeInTheDocument();
      expect(screen.getByText('Database connection timed out')).toBeInTheDocument();
    });
  });

  describe('ErrorBoundary', () => {
    it('renders children when no error is thrown', () => {
      render(
        <ErrorBoundary>
          <div>Safe Child Content</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('Safe Child Content')).toBeInTheDocument();
    });

    it('catches render error and displays accessible fallback UI', () => {
      // Suppress console.error in test output for controlled crash
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const CrashingComponent = () => {
        throw new Error('Controlled render explosion!');
      };

      render(
        <ErrorBoundary>
          <CrashingComponent />
        </ErrorBoundary>
      );

      const alertBox = screen.getByRole('alert');
      expect(alertBox).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
      expect(screen.getByText(/Reload Application/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});
