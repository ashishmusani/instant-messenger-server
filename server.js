const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cors = require('cors')
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());


var connectedUsers = [];

const users = [
  {username: 'admin', password: 'admin'},
  {username: 'user1', password: 'user1'},
  {username: 'user2', password: 'user2'},
]

io.on('connect',socket=>{
  socket.on('broadcast-to-server',(envelope)=>{
      socket.to('conference_room').emit('broadcast-to-clients',envelope);
  })
  socket.on('login',(username)=>{
      socket.join('conference_room');
      socket.join('PM_'+username);
      connectedUsers.push({username: username, id: socket.id});
      broadcastOnlineUsersList();
      console.log(connectedUsers);
  })
  socket.on('personal_message',(envelope)=>{
    socket.to('PM_'+envelope.to).emit('personal_message',envelope);
  })
  socket.on('disconnect', ()=>{
    const index = connectedUsers.findIndex(user => user.id === socket.id);
    if(index>=0){
      connectedUsers.splice(index, 1);
    }
    broadcastOnlineUsersList();
    console.log(connectedUsers);
  })
})

const broadcastOnlineUsersList = () =>{
  const connectedUsernames = connectedUsers.map(user => user.username).sort();
  io.emit('online-users-list', connectedUsernames)
}

server.listen(PORT, ()=>{
  console.log("Server listening on port " + PORT)
})

app.post('/login', (req,res)=>{
  const username = req.body.username;
  const password = req.body.password;
  const index_connected = connectedUsers.findIndex(user => user.username === username);
  if(index_connected>=0){
    return res.status(401).send("Already signed in");
  }
  const index_registered = users.findIndex(user => user.username === username);
  if(index_registered>=0){
    if(users[index_registered].password === password){
      return res.status(201).send("Success")
    } else{
      return res.status(401).send("Incorrect credentials")
    }
  } else{
    return res.status(401).send("Incorrect credentials")
  }
})
