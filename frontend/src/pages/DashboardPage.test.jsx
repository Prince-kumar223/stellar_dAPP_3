import { render, screen } from '@testing-library/react';
import DashboardPage from './DashboardPage';

const loadFeedback = vi.fn();
const createFeedback = vi.fn();
const setSelectedFeedback = vi.fn();

vi.mock('../hooks/useAutoRefresh', () => ({
  useAutoRefresh: vi.fn(),
}));

vi.mock('../hooks/useUserRegistry', () => ({
  useUserRegistry: () => ({
    registered: true,
    loading: false,
    error: '',
    transaction: { pending: false, success: '', error: '' },
  }),
}));

vi.mock('../hooks/useFeedbackContract', () => ({
  useFeedbackContract: () => ({
    feedback: [
      {
        id: 2,
        author: 'GBZXN7PIRZGNMHGA3DJZ7FJS6RDM3ZTCWJU2SB27W4R64DQFYMV4ABCDE',
        message: 'Review the onboarding flow.',
        status: 'Pending',
        createdAt: 0,
      },
      {
        id: 1,
        author: 'GBZXN7PIRZGNMHGA3DJZ7FJS6RDM3ZTCWJU2SB27W4R64DQFYMV4ABCDE',
        message: 'Resolved feedback entry.',
        status: 'Resolved',
        createdAt: 0,
      },
    ],
    selectedFeedback: null,
    loading: false,
    error: '',
    transaction: { pending: false, success: '', error: '' },
    loadFeedback,
    createFeedback,
    setSelectedFeedback,
  }),
}));

describe('DashboardPage', () => {
  it('renders dashboard metrics, wallet details, and feedback list', () => {
    render(
      <DashboardPage
        wallet={{
          address: 'GBZXN7PIRZGNMHGA3DJZ7FJS6RDM3ZTCWJU2SB27W4R64DQFYMV4ABCDE',
          balance: '123.45',
          connected: true,
          refreshBalance: vi.fn(),
        }}
        isAdmin={false}
        refreshToken={0}
        onMutation={vi.fn()}
      />,
    );

    expect(screen.getByText('123.45 XLM')).toBeInTheDocument();
    expect(screen.getByText('Recent submissions')).toBeInTheDocument();
    expect(screen.getByText('Review the onboarding flow.')).toBeInTheDocument();
    expect(screen.getByText('Resolved feedback entry.')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
