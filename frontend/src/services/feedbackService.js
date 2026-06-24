import {
  requireFeedbackContractId,
  requireUserRegistryContractId,
} from '../config/contracts';
import { NETWORK_CONFIG } from '../config/network';
import {
  addressToScVal,
  invokeContract,
  readScVal,
  simulateContract,
  stringToScVal,
  u32ToScVal,
} from './stellarClient';

const FEEDBACK_IDS_KEY = 'mini-dapp.feedback.ids';

const normalizeStatus = (status) => {
  if (!status) return 'Pending';
  if (typeof status === 'string') return status;
  if (Array.isArray(status)) return status[0] || 'Pending';
  return String(status);
};

const normalizeFeedback = (value, fallbackId) => {
  if (!value) return null;

  return {
    id: Number(value.id ?? fallbackId),
    author: value.author || '',
    message: value.message || '',
    status: normalizeStatus(value.status),
    createdAt: Number(value.created_at || value.createdAt || 0),
    reviewedAt: value.reviewed_at ?? value.reviewedAt ?? null,
    resolvedAt: value.resolved_at ?? value.resolvedAt ?? null,
  };
};

const getCachedIds = () => {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_IDS_KEY) || '[]');
  } catch {
    return [];
  }
};

const cacheId = (id) => {
  const nextIds = Array.from(new Set([Number(id), ...getCachedIds()]))
    .filter(Boolean)
    .sort((a, b) => b - a)
    .slice(0, 100);
  localStorage.setItem(FEEDBACK_IDS_KEY, JSON.stringify(nextIds));
};

export const feedbackService = {
  async createFeedback({ author, message }) {
    const feedbackContractId = requireFeedbackContractId();
    const userRegistryContractId = requireUserRegistryContractId();

    const result = await invokeContract({
      contractId: feedbackContractId,
      method: 'create_feedback',
      source: author,
      args: [
        addressToScVal(author),
        stringToScVal(message),
        addressToScVal(userRegistryContractId),
      ],
    });

    if (result.returnValue) {
      cacheId(result.returnValue);
    }

    return result;
  },

  async getFeedback(id, source) {
    const retval = await simulateContract({
      contractId: requireFeedbackContractId(),
      method: 'get_feedback',
      source,
      args: [u32ToScVal(id)],
    });

    return normalizeFeedback(readScVal(retval), id);
  },

  async listFeedback({ source, limit = NETWORK_CONFIG.maxFeedbackProbeId } = {}) {
    const cachedIds = getCachedIds();
    const probeIds = Array.from({ length: limit }, (_, index) => index + 1);
    const ids = Array.from(new Set([...cachedIds, ...probeIds])).sort((a, b) => b - a);
    const results = await Promise.allSettled(
      ids.map((id) => feedbackService.getFeedback(id, source)),
    );

    return results
      .map((result) => (result.status === 'fulfilled' ? result.value : null))
      .filter(Boolean)
      .sort((a, b) => b.id - a.id);
  },

  async reviewFeedback({ admin, id }) {
    return invokeContract({
      contractId: requireFeedbackContractId(),
      method: 'review_feedback',
      source: admin,
      args: [u32ToScVal(id)],
    });
  },

  async resolveFeedback({ admin, id }) {
    return invokeContract({
      contractId: requireFeedbackContractId(),
      method: 'resolve_feedback',
      source: admin,
      args: [u32ToScVal(id)],
    });
  },
};
