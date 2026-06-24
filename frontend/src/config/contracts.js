const readEnv = (key) => import.meta.env[key]?.trim() || '';

const missingContractMessage = (envName) =>
  `Missing ${envName}. Configure your deployed Soroban contract ID before using this action.`;

export const CONTRACTS = {
  feedbackContractId: readEnv('VITE_FEEDBACK_CONTRACT_ID'),
  userRegistryContractId: readEnv('VITE_USER_REGISTRY_CONTRACT_ID'),
  adminPublicKey: readEnv('VITE_ADMIN_PUBLIC_KEY'),
};

export const requireFeedbackContractId = () => {
  if (!CONTRACTS.feedbackContractId) {
    throw new Error(missingContractMessage('VITE_FEEDBACK_CONTRACT_ID'));
  }

  return CONTRACTS.feedbackContractId;
};

export const requireUserRegistryContractId = () => {
  if (!CONTRACTS.userRegistryContractId) {
    throw new Error(missingContractMessage('VITE_USER_REGISTRY_CONTRACT_ID'));
  }

  return CONTRACTS.userRegistryContractId;
};
