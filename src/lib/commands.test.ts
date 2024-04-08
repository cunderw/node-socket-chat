import { Socket } from 'net'

import * as UsersRepository from '../repository/users'
import { User } from '../repository/users'
import {
  broadcastMessage,
  handleLogin,
  handleRegister,
  processCommand
} from './commands'
import * as logger from './logger'

jest.mock('net', () => ({
  Socket: jest.fn().mockImplementation(() => ({
    write: jest.fn()
  }))
}))

jest.mock('./logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}))

jest.mock('../repository/Users')

const mockedSocket = new Socket() as jest.Mocked<Socket>
const mockedRegisterUser = UsersRepository.registerUser as jest.Mock
const mockedLoginUser = UsersRepository.loginUser as jest.Mock
const mockedGetActiveUsers = UsersRepository.getActiveUsers as jest.Mock

describe('handleRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should require nick and password', () => {
    handleRegister(mockedSocket)
    expect(mockedSocket.write).toHaveBeenCalledWith(
      expect.stringContaining(
        'You must provide a nick and password to register.\r\n'
      )
    )
  })

  it('should handle nick already in use', () => {
    mockedRegisterUser.mockReturnValue(false)
    handleRegister(mockedSocket, 'user', 'pass')
    expect(mockedSocket.write).toHaveBeenCalledWith(
      expect.stringContaining('Nick already in use.\r\n')
    )
  })

  it('should confirm successful registration', () => {
    mockedRegisterUser.mockReturnValue(true)
    handleRegister(mockedSocket, 'user', 'pass')
    expect(mockedSocket.write).toHaveBeenCalledWith(
      expect.stringContaining('Registration successful.')
    )
  })
})

describe('handleLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should require nick and password', () => {
    handleLogin(mockedSocket)
    expect(mockedSocket.write).toHaveBeenCalledWith(
      expect.stringContaining(
        'You must provide a nick and password to login.\r\n'
      )
    )
  })

  it('should handle invalid credentials', () => {
    mockedLoginUser.mockReturnValue(false)
    handleLogin(mockedSocket, 'user', 'wrong')
    expect(mockedSocket.write).toHaveBeenCalledWith(
      expect.stringContaining('Invalid nick or password.\r\n')
    )
  })

  it('should confirm successful login', () => {
    mockedLoginUser.mockReturnValue(true)
    const users: User[] = [
      {
        nick: 'user1',
        password: 'pass1',
        socket: new Socket() as jest.Mocked<Socket>
      },
      { nick: 'user2', password: 'pass2', socket: mockedSocket }, // Sender
      {
        nick: 'user3',
        password: 'pass3',
        socket: new Socket() as jest.Mocked<Socket>
      }
    ]

    mockedGetActiveUsers.mockReturnValue(users)

    handleLogin(mockedSocket, 'user', 'pass')

    expect(mockedSocket.write).toHaveBeenCalledWith(
      expect.stringContaining('Login successful.\r\n')
    )

    users.forEach((user) => {
      if (user.socket !== mockedSocket) {
        expect(user.socket?.write).toHaveBeenCalledWith(
          expect.stringContaining('user has joined the chat.\r\n')
        )
      }
    })
  })
})

describe('processCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should process authenticated commands', () => {
    const user: User = { nick: 'user', password: 'pass', socket: mockedSocket }
    processCommand(mockedSocket, '/anyCommand', user)
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Authenticated command.')
    )
  })

  it('should handle registration command', () => {
    processCommand(mockedSocket, '/register user pass')
    expect(mockedRegisterUser).toHaveBeenCalledWith('user', 'pass')
  })

  it('should handle login command', () => {
    processCommand(mockedSocket, '/login user pass')
    expect(mockedLoginUser).toHaveBeenCalledWith('user', 'pass', mockedSocket)
  })

  it('should notify unknown commands', () => {
    processCommand(mockedSocket, '/unknown')
    expect(mockedSocket.write).toHaveBeenCalledWith(
      expect.stringContaining('Unknown command.\r\n')
    )
  })
})

describe('broadcastMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should broadcast to all but sender', () => {
    const users: User[] = [
      {
        nick: 'user1',
        password: 'pass1',
        socket: new Socket() as jest.Mocked<Socket>
      },
      { nick: 'user2', password: 'pass2', socket: mockedSocket }, // Sender
      {
        nick: 'user3',
        password: 'pass3',
        socket: new Socket() as jest.Mocked<Socket>
      }
    ]

    mockedGetActiveUsers.mockReturnValue(users)
    broadcastMessage('Hello World', mockedSocket)

    users.forEach((user) => {
      if (user.socket !== mockedSocket) {
        expect(user.socket?.write).toHaveBeenCalledWith('Hello World')
      }
    })

    expect(mockedSocket.write).not.toHaveBeenCalledWith('Hello World')
  })

  it('should handle no active users', () => {
    mockedGetActiveUsers.mockReturnValue([])
    expect(() => broadcastMessage('Hello World', mockedSocket)).not.toThrow()
  })
})
