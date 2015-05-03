let jot = require('json-over-tcp')
const SERVER_TCP_PORT = process.env.SERVER_TCP_PORT || 8001
function createConnection(){
  let socket = jot.connect(SERVER_TCP_PORT, function(){
    socket.write({clientId: "10002"})
  })

  socket.on('data', function(data){
   console.log("Sync request from server: " + JSON.stringify(data))
  })
}

createConnection()
