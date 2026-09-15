import type { Content } from '../types';
import { JEJU_PLACES } from './jeju-places';

// Generic sample businesses, invented reviews and display-only ratings are excluded.
// The remaining attractions are unverified starter information, not a verified listing.
export const CONTENTS: Content[] = JEJU_PLACES.filter(p => p.contentType === 'activity').map(p => ({
  ...p, rating: 0, reviewCount: 0, reviews: undefined, menu: undefined,
  provenance: { source: 'local' },
}));
