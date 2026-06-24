import { useCallback, useEffect, useState } from 'react';
import { userRegistryService } from '../services/userRegistryService';

const initialTransaction = {
  pending: false,
  success: '',
  error: '',
};

export const useUserRegistry = ({ walletAddress, isAdmin, refreshToken = 0 } = {}) => {
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState(initialTransaction);

  const checkRegistration = useCallback(
    async (address = walletAddress) => {
      if (!address) {
        setRegistered(false);
        return false;
      }

      setLoading(true);
      setError('');
      try {
        const result = await userRegistryService.isRegistered(address, walletAddress);
        if (address === walletAddress) {
          setRegistered(result);
        }
        return result;
      } catch (registryError) {
        setError(registryError.message || 'Unable to check registration.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [walletAddress],
  );

  const registerUser = useCallback(
    async (user) => {
      if (!isAdmin || !walletAddress) {
        throw new Error('Only the configured admin wallet can register users.');
      }

      setTransaction({ pending: true, success: '', error: '' });
      try {
        await userRegistryService.registerUser({ admin: walletAddress, user });
        setTransaction({ pending: false, success: 'User registered successfully.', error: '' });
        await checkRegistration(user);
      } catch (registerError) {
        setTransaction({
          pending: false,
          success: '',
          error: registerError.message || 'Registration transaction failed.',
        });
        throw registerError;
      }
    },
    [checkRegistration, isAdmin, walletAddress],
  );

  const unregisterUser = useCallback(
    async (user) => {
      if (!isAdmin || !walletAddress) {
        throw new Error('Only the configured admin wallet can unregister users.');
      }

      setTransaction({ pending: true, success: '', error: '' });
      try {
        await userRegistryService.unregisterUser({ admin: walletAddress, user });
        setTransaction({ pending: false, success: 'User unregistered successfully.', error: '' });
        await checkRegistration(user);
      } catch (unregisterError) {
        setTransaction({
          pending: false,
          success: '',
          error: unregisterError.message || 'Unregister transaction failed.',
        });
        throw unregisterError;
      }
    },
    [checkRegistration, isAdmin, walletAddress],
  );

  useEffect(() => {
    checkRegistration();
  }, [checkRegistration, refreshToken]);

  return {
    registered,
    loading,
    error,
    transaction,
    checkRegistration,
    registerUser,
    unregisterUser,
  };
};
