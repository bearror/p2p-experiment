import { createControlMessageListener } from './src/meshConnector'

const socket = new WebSocket('ws://localhost:8080')

socket.onmessage = createControlMessageListener(socket)
socket.onopen = () => {
  socket.send(JSON.stringify({ type: 'MESH_CONNECT', payload: {} }))
}
