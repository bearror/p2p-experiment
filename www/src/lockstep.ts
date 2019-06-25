import { Peer } from '../../interfaces/Protocol'
import { createSimulation } from './simulation'

const INPUT_DELAY = 6 // 6 * 16 = 96ms -- SHOULD BE A GLOBAL CONSTANT!

async function sendInputsForStep(stepIndex: number, peers: Peer[]) {
  await Promise.all(
    peers.map(async peer => {
      await peer.ready
      peer.write(stepIndex)
    })
  )
}

async function receiveInputsForStep(stepIndex: number, peers: Peer[]) {
  // Steps during the initial INPUT_DELAY never receive inputs from peers
  if (stepIndex < INPUT_DELAY) {
    return peers.map(() => ({}))
  }

  return Promise.all(
    peers.map(
      peer =>
        new Promise((resolve, reject) => {
          peer.channel.onmessage = event => {
            // event.data
          }
        })
    )
  )
}

function receivePeerMessage(event: MessageEvent) {}

export function initializeLockstep(peers: Peer[]) {
  let stepIndex = 0
  let futureStepIndex = stepIndex + INPUT_DELAY

  peers.forEach(peer => {
    peer.channel.onmessage = receivePeerMessage
  })

  const tick = createSimulation([])
  const step = async () => {
    await sendInputsForStep(futureStepIndex, peers)
    const inputs = await receiveInputsForStep(stepIndex, peers)

    ///tick(inputs, stepIndex)

    stepIndex += 1
    futureStepIndex += 1
  }

  /*
  while (true) {
    step()
  }
  */
}
