import type { WorldEntity, WorldRelation } from './types';

export const exampleEntities: WorldEntity[] = [
  { id: 'artist-onboarding', workspaceId: 'demo', entityType: 'feature', name: 'Artist Onboarding', slug: 'artist-onboarding', state: {}, confidence: 1 },
  { id: 'supabase', workspaceId: 'demo', entityType: 'service', name: 'Supabase', slug: 'supabase', state: {}, confidence: 1 },
  { id: 'artist-page', workspaceId: 'demo', entityType: 'feature', name: 'Artist Page', slug: 'artist-page', state: {}, confidence: 0.95 },
  { id: 'inkshop', workspaceId: 'demo', entityType: 'feature', name: 'iNKSHOP', slug: 'inkshop', state: {}, confidence: 0.95 },
  { id: 'stripe', workspaceId: 'demo', entityType: 'service', name: 'Stripe', slug: 'stripe', state: {}, confidence: 1 },
  { id: 'analytics', workspaceId: 'demo', entityType: 'metric', name: 'Analytics', slug: 'analytics', state: {}, confidence: 0.9 },
  { id: 'revenue', workspaceId: 'demo', entityType: 'revenue_stream', name: 'Revenue Metrics', slug: 'revenue-metrics', state: {}, confidence: 0.9 },
];

export const exampleRelations: WorldRelation[] = [
  { id: 'r1', workspaceId: 'demo', fromEntityId: 'artist-onboarding', toEntityId: 'supabase', relationType: 'uses', weight: 0.9, confidence: 1 },
  { id: 'r2', workspaceId: 'demo', fromEntityId: 'supabase', toEntityId: 'artist-page', relationType: 'powers', weight: 0.85, confidence: 0.95 },
  { id: 'r3', workspaceId: 'demo', fromEntityId: 'artist-page', toEntityId: 'inkshop', relationType: 'enables', weight: 0.75, confidence: 0.9 },
  { id: 'r4', workspaceId: 'demo', fromEntityId: 'inkshop', toEntityId: 'stripe', relationType: 'uses', weight: 1, confidence: 1 },
  { id: 'r5', workspaceId: 'demo', fromEntityId: 'stripe', toEntityId: 'analytics', relationType: 'feeds', weight: 0.9, confidence: 0.95 },
  { id: 'r6', workspaceId: 'demo', fromEntityId: 'analytics', toEntityId: 'revenue', relationType: 'measured_by', weight: 0.85, confidence: 0.9 },
];
