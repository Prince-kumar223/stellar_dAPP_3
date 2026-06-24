import { useCallback, useState } from 'react';
import { feedbackService } from '../services/feedbackService';

const initialTransaction = {
  pending: false,
  success: '',
  error: '',
};

export const useFeedbackContract = ({ walletAddress, isAdmin } = {}) => {
  const [feedback, setFeedback] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState(initialTransaction);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const items = await feedbackService.listFeedback({ source: walletAddress });
      setFeedback(items);
      setSelectedFeedback((current) => {
        if (!current) return items[0] || null;
        return items.find((item) => item.id === current.id) || items[0] || null;
      });
      return items;
    } catch (loadError) {
      setError(loadError.message || 'Unable to load feedback.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const createFeedback = useCallback(
    async (message) => {
      if (!walletAddress) {
        throw new Error('Connect your wallet before creating feedback.');
      }

      setTransaction({ pending: true, success: '', error: '' });
      try {
        const result = await feedbackService.createFeedback({
          author: walletAddress,
          message,
        });
        setTransaction({
          pending: false,
          success: `Feedback ${result.returnValue || ''} created successfully.`,
          error: '',
        });
        await loadFeedback();
        return result;
      } catch (createError) {
        setTransaction({
          pending: false,
          success: '',
          error: createError.message || 'Feedback transaction failed.',
        });
        throw createError;
      }
    },
    [loadFeedback, walletAddress],
  );

  const reviewFeedback = useCallback(
    async (id) => {
      if (!isAdmin || !walletAddress) {
        throw new Error('Only the admin wallet can review feedback.');
      }

      setTransaction({ pending: true, success: '', error: '' });
      try {
        await feedbackService.reviewFeedback({ admin: walletAddress, id });
        setTransaction({ pending: false, success: `Feedback ${id} reviewed.`, error: '' });
        await loadFeedback();
      } catch (reviewError) {
        setTransaction({
          pending: false,
          success: '',
          error: reviewError.message || 'Review transaction failed.',
        });
        throw reviewError;
      }
    },
    [isAdmin, loadFeedback, walletAddress],
  );

  const resolveFeedback = useCallback(
    async (id) => {
      if (!isAdmin || !walletAddress) {
        throw new Error('Only the admin wallet can resolve feedback.');
      }

      setTransaction({ pending: true, success: '', error: '' });
      try {
        await feedbackService.resolveFeedback({ admin: walletAddress, id });
        setTransaction({ pending: false, success: `Feedback ${id} resolved.`, error: '' });
        await loadFeedback();
      } catch (resolveError) {
        setTransaction({
          pending: false,
          success: '',
          error: resolveError.message || 'Resolve transaction failed.',
        });
        throw resolveError;
      }
    },
    [isAdmin, loadFeedback, walletAddress],
  );

  return {
    feedback,
    selectedFeedback,
    loading,
    error,
    transaction,
    loadFeedback,
    setSelectedFeedback,
    createFeedback,
    reviewFeedback,
    resolveFeedback,
  };
};
