import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it.each(['Pending', 'Reviewed', 'Resolved'])('renders %s status', (status) => {
    render(<StatusBadge status={status} />);

    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it('falls back to Pending for empty status', () => {
    render(<StatusBadge status="" />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
