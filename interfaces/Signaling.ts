export interface SocketMessage {
  type: string
  payload: any
  key?: string
}

export interface SignalingAnswer extends SocketMessage {
  type: 'RTC_SESSION_DESCRIPTION_ANSWER'
  payload: RTCSessionDescriptionInit
  key: string
}

export interface SignalingOffer extends SocketMessage {
  type: 'RTC_SESSION_DESCRIPTION_OFFER'
  payload: RTCSessionDescriptionInit
  key: string
}

export interface SignalingCandidate extends SocketMessage {
  type: 'RTC_ICE_CANDIDATE'
  payload: RTCIceCandidate
  key: string
}

export type SignalingMessage =
  | SignalingAnswer
  | SignalingOffer
  | SignalingCandidate

export interface PeerInfo {
  key: string
}

export interface MeshConnectMessage extends SocketMessage {
  type: 'MESH_CONNECT'
  payload: string
}

export interface MeshConnectAcceptedMessage extends SocketMessage {
  type: 'MESH_CONNECT_ACCEPTED'
  payload: {
    peers: PeerInfo[]
  }
}

export interface MeshConnectRejectedMessage extends SocketMessage {
  type: 'MESH_CONNECT_REJECTED'
  payload: string
}

export interface MeshPeerConnectedMessage extends SocketMessage {
  type: 'MESH_PEER_CONNECTED'
  payload: PeerInfo
}

export type ControlMessage =
  | MeshConnectMessage
  | MeshConnectAcceptedMessage
  | MeshConnectRejectedMessage
  | MeshPeerConnectedMessage

export interface DataChannelOptions {
  label: string
  peerConnectionOptions: RTCConfiguration
  dataChannelOptions: RTCDataChannelInit

  sendMessage: (socket: WebSocket, message: SocketMessage) => void

  handleMessage: (
    event: MessageEvent,
    onSessionDescription: (description: RTCSessionDescriptionInit) => void,
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onRejection: (reason: any) => void
  ) => void
}
