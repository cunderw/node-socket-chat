import { Socket } from 'net'

import {
  getActiveUsers,
  loginUser,
  registerUser,
  User
} from '../repository/users'
import * as logger from './logger'

export function handleRegister(
  socket: Socket,
  nick?: string,
  password?: string
) {
  if (!nick || !password) {
    socket.write('You must provide a nick and password to register.\r\n')
    return
  }

  const success = registerUser(nick, password)

  if (!success) {
    socket.write('Nick already in use.\r\n')
    return
  }

  socket.write(
    'Registration successful. Login with /login <nick> <password>\r\n'
  )
}

export function handleLogin(socket: Socket, nick?: string, password?: string) {
  if (!nick || !password) {
    socket.write('You must provide a nick and password to login.\r\n')
    return
  }

  const success = loginUser(nick, password, socket)
  if (success) {
    socket.write('Login successful.\r\n')
    broadcastMessage(`${nick} has joined the chat.\r\n`, socket)
  } else {
    socket.write('Invalid nick or password.\r\n')
  }
}

export function processCommand(socket: Socket, message: string, user?: User) {
  const args = message.split(' ')
  const command = args[0]

  if (user) {
    logger.info('Authenticated command.\r\n')
    switch (command) {
      default:
        socket.write('Unknown command.\r\n')
        break
    }
  } else {
    logger.info('Unauthenticated command.\r\n')
    switch (command) {
      case '/register':
        handleRegister(socket, args[1], args[2])
        break

      case '/login':
        handleLogin(socket, args[1], args[2])
        break

      default:
        socket.write('Unknown command.\r\n')
        break
    }
  }
}

export function broadcastMessage(message: string, sender: Socket) {
  const activeUsers = getActiveUsers()
  activeUsers.forEach((user) => {
    if (user.socket !== sender) {
      user.socket?.write(message)
    }
  })
}
