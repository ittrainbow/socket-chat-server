const trimUserObject = (user) => {
  return Object.fromEntries(
    Object.entries(user).map(([key, value]) => {
      return [key, value.toLowerCase().trim()]
    })
  )
}

const findUser = (users, user) => {
  const currentUser = trimUserObject(user)
  const gotUser = users.find(
    (user) => user.name === currentUser.name && user.room == currentUser.room
  )

  return gotUser
}

const findRoom = (users, user) => {
  const gotRoom = users.find((el) => el.room === user.room)
  return gotRoom
}

const compareUsers = (user1, user2) => {
  return JSON.stringify(user1) === JSON.stringify(user2)
}

const getRoomUsers = (users, room) => {
  const getUsers = users.filter((el) => el.room === room).map((el) => el.name)
  const numberOfUsers = getUsers.length
  return { getUsers, numberOfUsers }
}

const broadcastRooms = (users, socket) => {
  const rooms = [...new Set(users.map((el) => el.room))]
  socket.broadcast.emit('getrooms', rooms)
}

module.exports = { findUser, findRoom, compareUsers, getRoomUsers, broadcastRooms }
