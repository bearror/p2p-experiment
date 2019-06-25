import { PeerInputMap } from '../../../interfaces/Input'
import {
  PhysicsObjectState,
  PhysicsState,
  Vector2D
} from '../../../interfaces/Physics'

export function updatePhysicsObject(
  obj: PhysicsObjectState,
  state: PhysicsState,
  inputs: PeerInputMap
): Vector2D {
  return [0, 0]
}
