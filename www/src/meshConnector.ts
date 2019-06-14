import {
  MeshConnectAcceptedMessage,
  MeshPeerConnectedMessage
} from '../../interfaces/Signaling'
import { answerConnection, offerConnection } from './peerConnector'
import { createSignalingOptions } from './signalingOptions'
import { tick } from './simulation'

export interface FlowControlledDataChannel {
  channel: RTCDataChannel
  ready: Promise<void>
  write: (message: ArrayBuffer) => void
}

function initializeChannel(channel: RTCDataChannel): FlowControlledDataChannel {
  const lowWaterMark = 262144
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

  channel.onmessage = event =>
    console.log(event.data, channel.bufferedAmount, channel.readyState)

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

  return {
    channel,
    ready,
    write
  }
}

function ready(channels: FlowControlledDataChannel[]) {
  console.log('Ready to go!', channels)

  if (channels.length > 0) {
    startTransfer(channels[0])
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function startTransfer(channel: FlowControlledDataChannel) {
  while (true) {
    await channel.ready
    await sleep(16) // ~60Hz tick
    channel.write(new ArrayBuffer(256))
  }
}

export function createControlMessageListener(socket: WebSocket) {
  return function controlMessageListener(event: MessageEvent) {
    const data = JSON.parse(event.data)

    switch (data.type) {
      case 'MESH_CONNECT_ACCEPTED': {
        const { payload }: MeshConnectAcceptedMessage = data
        const peerChannelsEstablished: Array<
          Promise<FlowControlledDataChannel>
        > = payload.peers.map(({ key }) =>
          answerConnection(socket, createSignalingOptions(key)).then(channel =>
            initializeChannel(channel)
          )
        )

        Promise.all(peerChannelsEstablished).then(channels => ready(channels))
        break
      }

      case 'MESH_PEER_CONNECTED': {
        const { payload }: MeshPeerConnectedMessage = data
        offerConnection(socket, createSignalingOptions(payload.key))
          .then(channel => initializeChannel(channel))
          .then(channel => ready([channel]))
      }
    }
  }
}
