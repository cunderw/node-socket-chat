// __mocks__/net.ts
import { EventEmitter } from 'events'

class MockSocket extends EventEmitter {
  write = jest.fn()
}

class MockServer extends EventEmitter {
  listen = jest.fn((port: number, host: string, callback?: () => void) => {
    this.emit('listening')
    if (callback) callback()
  })
}

const createServer = jest.fn((connectionListener) => {
  const server = new MockServer()

  // Simulate a new connection
  setImmediate(() => {
    const socket = new MockSocket()
    connectionListener(socket)
  })

  return server
})

export { createServer, MockSocket as Socket }
