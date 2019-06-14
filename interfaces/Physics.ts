export type Vector2D = [number, number]

export interface PhysicsObjectState {
  force: Vector2D
  position: Vector2D
  velocity: Vector2D
  mass: number
}

export type PhysicsState = PhysicsObjectState[]
