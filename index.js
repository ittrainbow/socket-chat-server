const express = require('express')
const app = express()

// const cors = require('cors')
const { findUser, findRoom, compareUsers, getRoomUsers, broadcastRooms } = require('./helpers')

const server = require('http').createServer(app)
const router = express.Router()

const io = require('socket.io')(server)

// const { Server } = require('socket.io')
// const io = new Server(
//   server,
//   {cors: { origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Access-Control-Allow-Origin'] }}
// )

// app.use(cors())
app.use(router)

const PORT = process.env.PORT || 5001
server.listen(PORT, () => console.log(`Server is running at ${PORT}`))

let users = []

const addRoomUser = (user) => {
  const userInRoom = findUser(users, user)
  !userInRoom ? users && users.push(user) : (users = [user])
  return userInRoom
}

const removeRoomUser = (user) => {
  const leavingUser = findUser(users, user)
  users = leavingUser ? users.filter((user) => !compareUsers(user, leavingUser)) : users
  return leavingUser
}

const adminData = (name) => {
  return {
    user: { name },
    timestamp: new Date().getTime()
  }
}

io.on('connection', (socket) => {
  socket.on('join', (user) => {
    const { name, room } = user
    if (name && room) {
      socket.join(room)
      addRoomUser(user)

      socket.emit('message', { ...adminData('Admin'), message: `Welcome, ${name}` })

      socket.broadcast.to(room).emit('message', { ...adminData('Admin'), message: `${name} entered room` })

      io.to(room).emit('usersupdated', getRoomUsers(users, room))
    }
  })

  socket.on('sendmessage', ({ room, name, message }) => {
    const user = { room, name }
    const getUser = findUser(users, user)

    getUser && io.to(room).emit('message', { ...adminData(name), message })
  })

  socket.on('inithome', () => {
    const rooms = [...new Set(users.map((el) => el.room))]
    socket.emit('getrooms', rooms)
  })

  socket.on('createroom', (user) => {
    const gotRoom = findRoom(users, user)
    if (!gotRoom) {
      users.push(user)
      broadcastRooms(users, socket)
    }
  })

  socket.on('leaveroom', (user) => {
    const { room, name } = user
    if (name) {
      const leavingUser = removeRoomUser(user)

      if (leavingUser) {
        const { getUsers, numberOfUsers } = getRoomUsers(users, room)

        io.to(room).emit('message', { ...adminData('Admin'), message: `${name} left room` })

        numberOfUsers > 0
          ? io.to(room).emit('usersupdated', { getUsers, numberOfUsers })
          : broadcastRooms(users, socket)
      }
    }

    socket.on('cleanrooms', () => {
      users = []
      broadcastRooms([], socket)
      console.log('clean rooms')
    })
  })

  socket.on('disconnect', () => {})
})
