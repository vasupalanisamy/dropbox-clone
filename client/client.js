let jot = require('json-over-tcp')
const SERVER_TCP_PORT = process.env.SERVER_TCP_PORT || 8001
const CLIENT_ID = process.env.CLIENT_ID || 10001
function createConnection(){
  let socket = jot.connect(SERVER_TCP_PORT, function(){
    socket.write({clientId: CLIENT_ID})
  })

  socket.on('data', function(data){
   console.log("Sync request from server: " + JSON.stringify(data))
  })
}

createConnection()
