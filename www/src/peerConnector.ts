import { Peer } from '../../interfaces/Protocol'
import {
  ServerConnectAccepted,
  ServerPeerConnected
} from '../../interfaces/Signaling'
import { initializeLockstep } from './lockstep'
import { answerConnection, offerConnection } from './rtcConnector'
import { createSignalingOptions } from './signalingOptions'

function initializePeer(channel: RTCDataChannel): Peer {
  const lowWaterMark = 262144 // should be constants!
  const highWaterMark = 1048576

  let paused = false
  let ready = Promise.resolve()
  let resolvePause: (value?: void | PromiseLike<void> | undefined) => void

  channel.bufferedAmountLowThreshold = lowWaterMark
  channel.onbufferedamountlow = () => {
    if (paused) {
      console.debug(
        `Data channel ${channel.label} resumed @ ${channel.bufferedAmount}`
      )
      paused = false
      resolvePause()
    }
  }

  const write = (message: ArrayBuffer) => {
    if (paused) {
      throw new Error('Unable to write, data channel is paused!')
    }

    channel.send(message)

    if (!paused && channel.bufferedAmount >= highWaterMark) {
      paused = true
      ready = new Promise(resolve => (resolvePause = resolve))
      console.debug(
        `Data channel ${channel.label} paused @ ${channel.bufferedAmount}`
      )
    }
  }

  return { channel, ready, write }
}

export function createServerMessageHandler(socket: WebSocket) {
  return (event: MessageEvent) => {
    const data = JSON.parse(event.data)

    switch (data.type) {
      case 'SERVER_CONNECT_ACCEPTED': {
        const { payload }: ServerConnectAccepted = data
        const peers: Array<Promise<Peer>> = payload.peers.map(({ key }) =>
          answerConnection(socket, createSignalingOptions(key)).then(channel =>
            initializePeer(channel)
          )
        )
        Promise.all(peers).then(p => initializeLockstep(p))
        break
      }

      case 'SERVER_PEER_CONNECTED': {
        const { payload }: ServerPeerConnected = data
        offerConnection(socket, createSignalingOptions(payload.key))
          .then(channel => initializePeer(channel))
          .then(peer => initializeLockstep([peer]))
      }
    }
  }
}
