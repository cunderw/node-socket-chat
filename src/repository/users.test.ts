import fs from 'node:fs'

import { Socket } from 'net'

import {
  activeUsers,
  allUsers,
  getActiveUserBySocket,
  getActiveUsers,
  getUserByNick,
  loadUsers,
  loginUser,
  registerUser,
  removeActiveUser,
  saveUsers
} from './users'

jest.mock('node:fs', () => ({
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}))

const mockedFs = jest.mocked(fs)

describe('User Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    allUsers.clear()
    activeUsers.clear()
  })

  describe('registerUser', () => {
    it('registers a new user and saves to file', () => {
      const result = registerUser('newUser', 'newPass')
      expect(result).toBeTruthy()
      expect(mockedFs.writeFileSync).toHaveBeenCalled()
    })

    it('does not register a user with an existing nick', () => {
      registerUser('existingUser', 'pass')
      const result = registerUser('existingUser', 'pass')
      expect(result).toBeFalsy()
    })
  })

  describe('loginUser', () => {
    it('does not login with incorrect credentials', () => {
      const socket = new Socket()
      const result = loginUser('nonexistent', 'wrong', socket)
      expect(result).toBeFalsy()
    })

    it('logs in with correct credentials', () => {
      const nick = 'existingUser'
      const password = 'password'
      registerUser(nick, password) // Ensure the user is registered
      const socket = new Socket()
      const result = loginUser(nick, password, socket)
      expect(result).toBeTruthy()
    })
  })

  describe('getUserByNick', () => {
    it('returns undefined for non-existent user', () => {
      const user = getUserByNick('nonexistent')
      expect(user).toBeUndefined()
    })

    it('retrieves the user by nick', () => {
      const nick = 'testUser'
      registerUser(nick, 'password')
      const user = getUserByNick(nick)
      expect(user).toBeDefined()
      expect(user?.nick).toEqual(nick)
    })
  })

  describe('getActiveUserBySocket', () => {
    it('returns undefined for non-existent socket', () => {
      const socket = new Socket()
      const user = getActiveUserBySocket(socket)
      expect(user).toBeUndefined()
    })

    it('retrieves the active user by socket', () => {
      const nick = 'activeUser'
      const password = 'password'
      registerUser(nick, password)
      const socket = new Socket()
      loginUser(nick, password, socket)
      const user = getActiveUserBySocket(socket)
      expect(user).toBeDefined()
      expect(user?.nick).toEqual(nick)
    })
  })

  describe('removeActiveUser', () => {
    it('removes an active user by socket', () => {
      const socket = new Socket()
      registerUser('userToRemove', 'pass')
      loginUser('userToRemove', 'pass', socket)
      expect(getActiveUsers()).toHaveLength(1)
      removeActiveUser(socket)
      expect(getActiveUsers()).toHaveLength(0)
    })
  })

  describe('getActiveUsers', () => {
    it('returns a list of active users', () => {
      const socket1 = new Socket()
      const socket2 = new Socket()
      registerUser('user1', 'pass1')
      registerUser('user2', 'pass2')
      loginUser('user1', 'pass1', socket1)
      loginUser('user2', 'pass2', socket2)
      const activeUsers = getActiveUsers()
      expect(activeUsers).toHaveLength(2)
    })
  })

  describe('saveUsers', () => {
    it('saves users to a file', () => {
      registerUser('userToSave', 'password')
      saveUsers()
      expect(mockedFs.writeFileSync).toHaveBeenCalled()
    })
  })

  describe('loadUsers', () => {
    it('loads users from a file if it exists', () => {
      const users = [
        ['userToLoad', { nick: 'userToLoad', password: 'password' }]
      ]
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(users))
      loadUsers()
      expect(mockedFs.readFileSync).toHaveBeenCalled()
      const loadedUser = getUserByNick('userToLoad')
      expect(loadedUser).toBeDefined()
      expect(loadedUser?.nick).toEqual('userToLoad')
    })

    it('does nothing if the file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false)
      loadUsers()
      expect(mockedFs.readFileSync).not.toHaveBeenCalled()
    })
  })
})
