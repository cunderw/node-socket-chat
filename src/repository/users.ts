import fs from 'node:fs'

import type { Socket } from 'net'

const saveFile = `${process.cwd()}/users.json`

export type User = {
  nick: string
  password: string
  socket?: Socket
}

export const allUsers = new Map<string, User>()
export const activeUsers = new Map<Socket, User>()

export const getUserByNick = (nick: string): User | undefined => {
  return allUsers.get(nick)
}

export const getActiveUserBySocket = (socket: Socket): User | undefined => {
  return activeUsers.get(socket)
}

export const removeActiveUser = (socket: Socket) => {
  activeUsers.delete(socket)
}

export const getActiveUsers = (): User[] => {
  return Array.from(activeUsers.values())
}

export const registerUser = (nick: string, password: string): boolean => {
  if (allUsers.has(nick)) {
    return false
  }

  allUsers.set(nick, { nick, password })

  saveUsers()

  return true
}

export const loginUser = (
  nick: string,
  password: string,
  socket: Socket
): boolean => {
  const user = allUsers.get(nick)

  if (!user || user.password !== password) {
    return false
  }

  activeUsers.set(socket, { ...user, socket })

  return true
}

export function saveUsers() {
  const users = Array.from(allUsers)

  console.log('Saving users', users)

  fs.writeFileSync(saveFile, JSON.stringify(users))
}

export function loadUsers() {
  if (fs.existsSync(saveFile)) {
    const usersJson = fs.readFileSync(saveFile, 'utf-8')
    const users = JSON.parse(usersJson) as [
      string,
      { nick: string; password: string }
    ][]

    console.log('Loading users...', users)

    users.forEach(([nick, user]) => {
      allUsers.set(nick, { ...user, socket: undefined })
    })
  }
}
