import { PeerInputMap, TickPeerInputMap } from '../../interfaces/Input'
import {
  PhysicsObjectState,
  PhysicsState,
  Vector2D
} from '../../interfaces/Physics'
import { updatePhysicsObject } from './physicsObjects'

const TIME_STEP = 16 // ms -- SHOULD BE A GLOBAL CONSTANT!
const HALF_TIME_STEP = TIME_STEP / 2 // ms

function calculateVelocity(obj: PhysicsObjectState): Vector2D {
  return [
    obj.velocity[0] + obj.force[0] * (HALF_TIME_STEP / obj.mass),
    obj.velocity[1] + obj.force[1] * (HALF_TIME_STEP / obj.mass)
  ]
}

function calculatePosition(obj: PhysicsObjectState): Vector2D {
  return [
    obj.position[0] + obj.velocity[0] * TIME_STEP,
    obj.position[1] + obj.velocity[1] * TIME_STEP
  ]
}

function integrate(state: PhysicsState, inputs: PeerInputMap) {
  // Mutates the physicsObjects in place for efficiency
  state.forEach(physicsObject => {
    physicsObject.velocity = calculateVelocity(physicsObject)
    physicsObject.position = calculatePosition(physicsObject)

    // Side-effects are allowed for the update functions, e.g. a player-unit
    // can add additional physicsObjects (bullets, particles, ...) directly to
    // the state array. In these cases it is OK to set the initial state for
    // the created objects -- otherwise only the new force should be returned.
    physicsObject.force = updatePhysicsObject(physicsObject, state, inputs)

    physicsObject.velocity = calculateVelocity(physicsObject)
  })
}

export function createSimulation(initialState: PhysicsState) {
  const state: PhysicsState = initialState

  let time = 0
  let tickIndex = 0
  let currentTime = performance.now()
  let newTime
  let tickTime
  let accumulator = 0

  return (inputs: TickPeerInputMap, tickUntil: number) => {
    newTime = performance.now()
    tickTime = newTime - currentTime
    currentTime = newTime
    accumulator += tickTime

    while (accumulator >= TIME_STEP && tickIndex < tickUntil) {
      // Consider pushing each state to a history buffer for rewinding?
      integrate(state, inputs[tickIndex])

      time += TIME_STEP
      tickIndex += 1
      accumulator -= TIME_STEP
    }

    // Implement actual rendering... It does not even belong here!
    requestAnimationFrame(() => console.log(time, tickIndex, state))
  }
}
