import { requireUserRegistryContractId } from '../config/contracts';
import {
  addressToScVal,
  invokeContract,
  readScVal,
  simulateContract,
} from './stellarClient';

export const userRegistryService = {
  async isRegistered(user, source) {
    if (!user) return false;

    const retval = await simulateContract({
      contractId: requireUserRegistryContractId(),
      method: 'is_registered',
      source,
      args: [addressToScVal(user)],
    });

    return Boolean(readScVal(retval));
  },

  async registerUser({ admin, user }) {
    return invokeContract({
      contractId: requireUserRegistryContractId(),
      method: 'register_user',
      source: admin,
      args: [addressToScVal(user)],
    });
  },

  async unregisterUser({ admin, user }) {
    return invokeContract({
      contractId: requireUserRegistryContractId(),
      method: 'unregister_user',
      source: admin,
      args: [addressToScVal(user)],
    });
  },
};
