import type {
  CreateTripPlanInput,
  RestoreTripPlanRevisionInput,
  UpdateTripPlanInput,
} from '@/domain/trip-plan'
import type { TripPlanRevisionRow, TripPlanRow } from '@/lib/schema'

export interface TripPlanRepository {
  list: (ownerId: string) => Promise<TripPlanRow[]>
  get: (ownerId: string, id: string) => Promise<TripPlanRow | null>
  create: (ownerId: string, input: CreateTripPlanInput) => Promise<TripPlanRow>
  update: (ownerId: string, input: UpdateTripPlanInput) => Promise<TripPlanRow>
  listRevisions: (ownerId: string, id: string) => Promise<TripPlanRevisionRow[]>
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
