import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateFeedbackForm from './CreateFeedbackForm';

describe('CreateFeedbackForm', () => {
  it('shows a clear validation message when wallet is disconnected', () => {
    render(<CreateFeedbackForm connected={false} registered={false} onCreate={vi.fn()} />);

    expect(screen.getByText('Connect your wallet before submitting feedback.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit feedback/i })).toBeDisabled();
  });

  it('submits trimmed feedback when connected and registered', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue();

    render(<CreateFeedbackForm connected registered onCreate={onCreate} />);

    await user.type(screen.getByPlaceholderText(/write feedback/i), '  Great update  ');
    await user.click(screen.getByRole('button', { name: /submit feedback/i }));

    expect(onCreate).toHaveBeenCalledWith('Great update');
  });
});
