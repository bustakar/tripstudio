import type {
  CreateTripPlanInput,
  RestoreTripPlanRevisionInput,
  UpdateTripPlanInput,
} from '@/domain/trip-plan'
import type { TripPlanRevisionRow, TripPlanRow } from '@/lib/schema'

export type TripPlanRevisionSummary = Pick<
  TripPlanRevisionRow,
  'id' | 'tripPlanId' | 'version' | 'createdAt'
> & { title: string }

export type TripPlanRevisionPage = {
  revisions: TripPlanRevisionSummary[]
  nextBeforeVersion: number | null
}

export type TripPlanWithRevisionHistory = TripPlanRevisionPage & {
  plan: TripPlanRow | null
}

export interface TripPlanRepository {
  list: (ownerId: string) => Promise<TripPlanRow[]>
  get: (ownerId: string, id: string) => Promise<TripPlanRow | null>
  create: (ownerId: string, input: CreateTripPlanInput) => Promise<TripPlanRow>
  update: (ownerId: string, input: UpdateTripPlanInput) => Promise<TripPlanRow>
  getWithRevisionHistory: (
    ownerId: string,
    id: string,
  ) => Promise<TripPlanWithRevisionHistory>
  listRevisions: (
    ownerId: string,
    id: string,
    beforeVersion?: number,
  ) => Promise<TripPlanRevisionPage>
  getRevision: (
    ownerId: string,
    id: string,
    version: number,
  ) => Promise<TripPlanRevisionRow | null>
  restoreRevision: (
    ownerId: string,
    input: RestoreTripPlanRevisionInput,
  ) => Promise<TripPlanRow>
}

export class VersionConflictError extends Error {
  constructor() {
    super('The project changed. Read the current version before retrying.')
  }
}

export class RevisionNotFoundError extends Error {
  constructor() {
    super('Trip plan revision not found')
  }
}
