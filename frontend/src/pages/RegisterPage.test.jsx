import { render, screen } from '@testing-library/react';
import RegisterPage from './RegisterPage';

vi.mock('../hooks/useUserRegistry', () => ({
  useUserRegistry: () => ({
    registered: false,
    loading: false,
    error: '',
    transaction: { pending: false, success: '', error: '' },
    checkRegistration: vi.fn(),
    registerUser: vi.fn(),
    unregisterUser: vi.fn(),
  }),
}));

describe('RegisterPage', () => {
  it('renders the registration management UI', () => {
    render(
      <RegisterPage
        wallet={{
          address: 'GBZXN7PIRZGNMHGA3DJZ7FJS6RDM3ZTCWJU2SB27W4R64DQFYMV4ABCDE',
          connected: true,
        }}
        isAdmin
        onRegistered={vi.fn()}
      />,
    );

    expect(screen.getByText('Registration status')).toBeInTheDocument();
    expect(screen.getByText('Manage user access')).toBeInTheDocument();
    expect(screen.getByLabelText(/user public key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^register$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unregister/i })).toBeInTheDocument();
  });
});
