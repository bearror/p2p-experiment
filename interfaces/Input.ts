export interface Input {
  left: boolean
  right: boolean
  jump: boolean
}

export interface PeerInputMap {
  [key: string]: Input
}

export interface TickPeerInputMap {
  [key: number]: PeerInputMap
}
