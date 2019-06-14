import {
  DataChannelOptions,
  SignalingAnswer,
  SignalingCandidate,
  SignalingOffer,
  SocketMessage
} from '../../interfaces/Signaling'

const defaultDataChannelOptions: RTCDataChannelInit = {
  ordered: false,
  maxRetransmits: 0
}

export function createSignalingOptions(key: string): DataChannelOptions {
  return {
    label: `mesh-connection-${key}`,
    peerConnectionOptions: {},
    dataChannelOptions: defaultDataChannelOptions, // no override for now

    sendMessage: (socket, { type, payload }: SocketMessage) => {
      socket.send(JSON.stringify({ type, payload, key }))
    },

    // Note that this is one of potentially many attached message handlers
    handleMessage: (event, onSessionDescription, onIceCandidate) => {
      const data = JSON.parse(event.data)

      if (data.key !== key) {
        return // return early if not handling the specific peer
      }

      switch (data.type) {
        case 'RTC_SESSION_DESCRIPTION_ANSWER': {
          const { payload }: SignalingAnswer = data
          return onSessionDescription(payload)
        }

        case 'RTC_SESSION_DESCRIPTION_OFFER': {
          const { payload }: SignalingOffer = data
          return onSessionDescription(payload)
        }

        case 'RTC_ICE_CANDIDATE': {
          const { payload }: SignalingCandidate = data
          return onIceCandidate(payload)
        }
      }
    }
  }
}
