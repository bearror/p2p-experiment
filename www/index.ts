import { createServerMessageHandler } from './src/peerConnector'

const socket = new WebSocket('ws://localhost:8080')

socket.onmessage = createServerMessageHandler(socket)
socket.onopen = () => {
  socket.send(JSON.stringify({ type: 'SERVER_CONNECT', payload: {} }))
}
