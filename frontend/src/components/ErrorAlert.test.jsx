import { render, screen } from '@testing-library/react';
import ErrorAlert from './ErrorAlert';

describe('ErrorAlert', () => {
  it('displays error title and message', () => {
    render(<ErrorAlert title="Configuration error" message="Missing VITE_FEEDBACK_CONTRACT_ID." />);

    expect(screen.getByText('Configuration error')).toBeInTheDocument();
    expect(screen.getByText('Missing VITE_FEEDBACK_CONTRACT_ID.')).toBeInTheDocument();
  });

  it('renders nothing without a message', () => {
    const { container } = render(<ErrorAlert title="Hidden" />);

    expect(container).toBeEmptyDOMElement();
  });
});
