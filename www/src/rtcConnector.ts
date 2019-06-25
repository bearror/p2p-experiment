import { DataChannelOptions } from '../../interfaces/Signaling'

function removeHandlers(
  socket: WebSocket,
  connection: RTCPeerConnection,
  messageListener: (event: MessageEvent) => void,
  closeListener: (event: CloseEvent) => void
) {
  socket.removeEventListener('message', messageListener)
  socket.removeEventListener('close', closeListener)

  connection.onnegotiationneeded = null
  connection.onicecandidate = null
  connection.onconnectionstatechange = null
  connection.ondatachannel = null
}

export function offerConnection(
  socket: WebSocket,
  {
    label,
    peerConnectionOptions,
    dataChannelOptions,
    sendMessage,
    handleMessage
  }: DataChannelOptions
): Promise<RTCDataChannel> {
  return new Promise((resolve, reject) => {
    const connection = new RTCPeerConnection(peerConnectionOptions)
    const channel = connection.createDataChannel(label, dataChannelOptions)
    const candidates: RTCIceCandidate[] = []

    let hasAnswer = false

    function messageListener(event: MessageEvent) {
      handleMessage(
        event,

        remoteDescription => {
          connection.setRemoteDescription(remoteDescription)
          candidates.forEach(candidate => connection.addIceCandidate(candidate))

          hasAnswer = true
        },

        candidate => {
          if (hasAnswer) {
            connection.addIceCandidate(candidate)
          } else {
            candidates.push(candidate)
          }
        },

        reason => {
          removeHandlers(socket, connection, messageListener, closeListener)
          reject(reason)
        }
      )
    }

    function closeListener() {
      removeHandlers(socket, connection, messageListener, closeListener)
      reject(new Error('WebSocket closed'))
    }

    socket.addEventListener('message', messageListener)
    socket.addEventListener('close', closeListener)

    connection.onnegotiationneeded = () => {
      connection.createOffer().then(localDescription => {
        connection.setLocalDescription(localDescription)

        sendMessage(socket, {
          type: 'RTC_SESSION_DESCRIPTION_OFFER',
          payload: localDescription
        })
      })
    }

    connection.onicecandidate = event => {
      if (event.candidate) {
        sendMessage(socket, {
          type: 'RTC_ICE_CANDIDATE',
          payload: event.candidate
        })
      }
    }

    connection.onconnectionstatechange = () => {
      if (!['connecting', 'connected'].includes(connection.connectionState)) {
        removeHandlers(socket, connection, messageListener, closeListener)
        reject(new Error('RTCPeerConnection closed'))
      }
    }

    channel.onopen = () => {
      removeHandlers(socket, connection, messageListener, closeListener)
      resolve(channel)
    }
  })
}

export function answerConnection(
  socket: WebSocket,
  { peerConnectionOptions, sendMessage, handleMessage }: DataChannelOptions
): Promise<RTCDataChannel> {
  return new Promise((resolve, reject) => {
    const connection = new RTCPeerConnection(peerConnectionOptions)
    const candidates: RTCIceCandidate[] = []

    let hasOffer = false

    function messageListener(event: MessageEvent) {
      handleMessage(
        event,

        remoteDescription => {
          connection.setRemoteDescription(remoteDescription)
          connection.createAnswer().then(localDescription => {
            connection.setLocalDescription(localDescription)
            candidates.forEach(candidate =>
              connection.addIceCandidate(candidate)
            )

            hasOffer = true

            sendMessage(socket, {
              type: 'RTC_SESSION_DESCRIPTION_ANSWER',
              payload: localDescription
            })
          })
        },

        candidate => {
          if (hasOffer) {
            connection.addIceCandidate(candidate)
          } else {
            candidates.push(candidate)
          }
        },

        reason => {
          removeHandlers(socket, connection, messageListener, closeListener)
          reject(reason)
        }
      )
    }

    function closeListener() {
      removeHandlers(socket, connection, messageListener, closeListener)
      reject(new Error('WebSocket closed'))
    }

    socket.addEventListener('message', messageListener)
    socket.addEventListener('close', closeListener)

    connection.onicecandidate = event => {
      if (event.candidate) {
        sendMessage(socket, {
          type: 'RTC_ICE_CANDIDATE',
          payload: event.candidate
        })
      }
    }

    connection.onconnectionstatechange = () => {
      if (!['connecting', 'connected'].includes(connection.connectionState)) {
        removeHandlers(socket, connection, messageListener, closeListener)
        reject(new Error('RTCPeerConnection closed'))
      }
    }

    connection.ondatachannel = event => {
      event.channel.onopen = () => {
        removeHandlers(socket, connection, messageListener, closeListener)
        resolve(event.channel)
      }
    }
  })
}
