import { v4 as uuid } from 'uuid'
import * as WebSocket from 'ws'
import {
  PeerInfo,
  SignalingMessage,
  SocketMessage
} from '../interfaces/Signaling'

export interface PeerMap {
  [key: string]: WebSocket
}

const wss = new WebSocket.Server({ port: 8080 })
const mesh: PeerMap = {}

function sendMessage(socket: WebSocket, { type, payload, key }: SocketMessage) {
  socket.send(JSON.stringify({ type, payload, key }))
}

let seq = 0

wss.on('connection', ws => {
  const id = uuid()

  mesh[id] = ws

  ws.on('message', message => {
    if (typeof message !== 'string') {
      return // return early on unsupported buffer types
    }

    const data = JSON.parse(message)

    console.log(`${seq++}\t${data.type}`)

    switch (data.type) {
      case 'MESH_CONNECT': {
        const peers: PeerInfo[] = Object.keys(mesh)
          .filter(k => k !== id)
          .map(k => ({ key: k }))

        sendMessage(ws, {
          type: 'MESH_CONNECT_ACCEPTED',
          payload: { peers }
        })

        Object.values(mesh)
          .filter(s => s !== ws)
          .forEach(socket =>
            sendMessage(socket, {
              type: 'MESH_PEER_CONNECTED',
              payload: { key: id }
            })
          )
        break
      }

      case 'RTC_SESSION_DESCRIPTION_ANSWER':
      case 'RTC_SESSION_DESCRIPTION_OFFER':
      case 'RTC_ICE_CANDIDATE': {
        const { type, payload, key }: SignalingMessage = data

        sendMessage(mesh[key], { type, payload, key: id }) // swap keys
      }
    }
  })

  ws.on('close', () => {
    delete mesh[id]
  })
})
