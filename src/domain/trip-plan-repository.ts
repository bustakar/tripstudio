import type {
  CreateTripPlanInput,
  UpdateTripPlanInput,
} from '@/domain/trip-plan'
import type { TripPlanRow } from '@/lib/schema'

export interface TripPlanRepository {
  list: (ownerId: string) => Promise<TripPlanRow[]>
  get: (ownerId: string, id: string) => Promise<TripPlanRow | null>
  create: (ownerId: string, input: CreateTripPlanInput) => Promise<TripPlanRow>
  update: (ownerId: string, input: UpdateTripPlanInput) => Promise<TripPlanRow>
}

export class VersionConflictError extends Error {
  constructor() {
    super('The project changed. Read the current version before retrying.')
  }
}
