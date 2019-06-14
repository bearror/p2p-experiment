import { PhysicsState, Vector2D } from '../../interfaces/Physics'

const TIME_STEP = 16 // ms
const HALF_TIME_STEP = TIME_STEP / 2 // ms

function getForce(): Vector2D {
  return [0, 1]
}

function calculateVelocity(
  velocity: Vector2D,
  force: Vector2D,
  factor: number
): Vector2D {
  return [velocity[0] + force[0] * factor, velocity[1] + force[1] * factor]
}

function calculatePosition(
  position: Vector2D,
  halfStepVelocity: Vector2D,
  deltaTime: number
): Vector2D {
  return [
    position[0] + halfStepVelocity[0] * deltaTime,
    position[1] + halfStepVelocity[1] * deltaTime
  ]
}

function integrate(state: PhysicsState): PhysicsState {
  const nextState = []

  for (const { force, position, velocity, mass } of state) {
    const factor = HALF_TIME_STEP / mass

    const halfStepVelocity = calculateVelocity(velocity, force, factor)
    const nextPosition = calculatePosition(
      position,
      halfStepVelocity,
      TIME_STEP
    )
    const nextForce = getForce()
    const nextVelocity = calculateVelocity(halfStepVelocity, nextForce, factor)

    nextState.push({
      force: nextForce,
      position: nextPosition,
      velocity: nextVelocity,
      mass
    })
  }

  return nextState
}

let t = 0
let currentTime = performance.now()
let newTime
let frameTime
let accumulator = 0
let previousState: PhysicsState = []
let currentState: PhysicsState = [
  {
    force: [0, 0],
    position: [0, 0],
    velocity: [0, 0],
    mass: 100
  },
  {
    force: [0, 0],
    position: [1, 2],
    velocity: [0, 0],
    mass: 120
  }
]

export function tick() {
  newTime = performance.now()
  frameTime = newTime - currentTime
  currentTime = newTime
  accumulator += frameTime

  while (accumulator >= TIME_STEP) {
    previousState = currentState
    currentState = integrate(currentState)

    console.log(currentState)

    t += TIME_STEP
    accumulator -= TIME_STEP
  }
}
