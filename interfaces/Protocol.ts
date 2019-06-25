export interface Peer {
  channel: RTCDataChannel
  ready: Promise<void>
  write: (message: any) => void
}
