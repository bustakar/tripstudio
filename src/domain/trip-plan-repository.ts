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
  list: (userId: string) => Promise<TripPlanRow[]>
  get: (userId: string, id: string) => Promise<TripPlanRow | null>
  create: (ownerId: string, input: CreateTripPlanInput) => Promise<TripPlanRow>
  update: (userId: string, input: UpdateTripPlanInput) => Promise<TripPlanRow>
  getWithRevisionHistory: (
    userId: string,
    id: string,
  ) => Promise<TripPlanWithRevisionHistory>
  listRevisions: (
    userId: string,
    id: string,
    beforeVersion?: number,
  ) => Promise<TripPlanRevisionPage>
  getRevision: (
    userId: string,
    id: string,
    version: number,
  ) => Promise<TripPlanRevisionRow | null>
  restoreRevision: (
    userId: string,
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
