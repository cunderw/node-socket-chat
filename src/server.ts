import type { Socket } from 'net'
import { createServer } from 'net'

import { broadcastMessage, processCommand } from './lib/commands'
import {
  getActiveUserBySocket,
  loadUsers,
  removeActiveUser,
  saveUsers
} from './repository/users'

const port: number = 2323
const host: string = '127.0.0.1'

loadUsers()

const server = createServer((socket: Socket) => {
  console.log('Client connected')
  socket.write('Welcome to the live chat!\r\n')
  socket.write(
    'Register with /register <username> <password> or login with /login <username> <password>\r\n'
  )

  socket.on('data', (data: Buffer) => {
    const message: string = data.toString().trim()
    console.log(`Message received: ${message}`)

    const user = getActiveUserBySocket(socket)

    if (message.startsWith('/')) {
      processCommand(socket, message, user)
    } else {
      if (user) {
        broadcastMessage(`${user.nick} says: ${message}\r\n`, socket)
      }
    }
  })

  socket.on('end', () => {
    console.log('Client disconnected')

    const user = getActiveUserBySocket(socket)

    if (user) {
      broadcastMessage(`${user.nick} has left the chat.`, socket)
    }

    removeActiveUser(socket)
  })

  socket.on('error', (err: Error) => {
    console.error(`Connection error: ${err.message}`)

    const user = getActiveUserBySocket(socket)

    if (user) {
      broadcastMessage(`${user.nick} has left the chat.`, socket)
    }

    removeActiveUser(socket)
  })
})

server.listen(port, host, () => {
  console.log(`Server listening on ${host}:${port}`)
})

process.on('SIGINT', () => {
  console.log('Shutting down')
  saveUsers()
})
