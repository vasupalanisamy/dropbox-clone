let jot = require('json-over-tcp')
let fs = require('fs')
let path = require('path')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
require('songbird')
let argv = require('yargs')
	.argv
const SERVER_TCP_PORT = process.env.SERVER_TCP_PORT || 8001
const CLIENT_ID = process.env.CLIENT_ID || 10001
const ROOT_DIR = process.env.DIR ? path.resolve(process.env.DIR) : (argv.dir ? path.resolve(argv.dir) : path.resolve(process.cwd()))
const ACTION_CREATE = 'create'
const ACTION_UPDATE = 'update'
const ACTION_DELETE = 'delete'
const TYPE_DIR = 'dir'

console.log('Client is using ROOT_DIR:' + ROOT_DIR)

async function setFileMeta (req) {
	req.filePath = path.resolve(path.join(ROOT_DIR, req.path))
	if(req.filePath.indexOf(ROOT_DIR) !== 0) {
		console.log('Invalid path')
		return
	}
	await fs.promise.stat(req.filePath)
		.then(stat => req.stat = stat, () => req.stat = null)
	req.dirPath = (req.type === TYPE_DIR) ? req.filePath : path.dirname(req.filePath)
}

async function handleSyncRequests(req) {
	console.log("Sync request from server: " + JSON.stringify(req))

	await setFileMeta(req)

	console.log('req.action' + req.action)
	console.log('req.filePath' + req.filePath)
	console.log('req.dirPath' + req.dirPath)

	if(req.action === ACTION_CREATE) {
		if(req.stat) {
			console.log('File exists')
		} else {
			await mkdirp.promise(req.dirPath)
			if(!req.isDir) {
				await fs.promise.writeFile(req.filePath, new Buffer(req.contents.data), null)
				await fs.promise.utimes(req.filePath, req.updated, req.updated)
			}
		}
	} else if (req.action === ACTION_UPDATE) {
		if(!req.stat) console.log('File does not exist')
		if(req.isDir) console.log('Path is a directory')
		await fs.promise.truncate(req.filePath, 0)
		await fs.promise.writeFile(req.filePath, new Buffer(req.contents.data), null)
		await fs.promise.utimes(req.filePath, req.updated, req.updated)
	} else if (req.action === ACTION_DELETE) {
		if(!req.stat) console.log('Invalid Path')
		req.isDir = req.stat.isDirectory()
		if(req.isDir) {
			await rimraf.promise(req.filePath)
		} else {
			await fs.promise.unlink(req.filePath)
		}
	} else {
		console.log("unknown action from server")
	}
}

async() => {
  let socket = jot.connect(SERVER_TCP_PORT, function(){
    socket.write({clientId: CLIENT_ID})
  })

  socket.on('data', (data) => handleSyncRequests(data))

}()



