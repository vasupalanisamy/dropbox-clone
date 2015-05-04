let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')
require('songbird')
// let bluebird = require('bluebird')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
// bluebird.longStackTraces()
require('longjohn')
let jot = require('json-over-tcp')
let argv = require('yargs')
	.argv

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = argv.dir ? path.resolve(argv.dir) : path.resolve(process.cwd())
const TCP_PORT = process.env.TCP_PORT || 8001
const ACTION_CREATE = 'create'
const ACTION_UPDATE = 'update'
const ACTION_DELETE = 'delete'
const TYPE_FILE = 'file'
const TYPE_DIR = 'dir'
let clientSocketList = []

let app = express()

if (NODE_ENV === 'development') {
	app.use(morgan('dev'))
}
app.listen(PORT, ()=> console.log(`LISTENING @ http://127.0.0.1:${PORT}`))
app.get('*', setFileMeta, sendHeaders, (req, res) => {
	if(res.body) {
		res.json(res.body)
		return
	}
	fs.createReadStream(req.filePath).pipe(res)
})
app.head('*', setFileMeta, sendHeaders, (req, res) => res.end())
app.delete('*', setFileMeta, (req, res, next) => {
	async() => {
		if(!req.stat) return res.send(400, 'Invalid Path')
		req.isDir = req.stat.isDirectory()
		if(req.isDir) {
			await rimraf.promise(req.filePath)
		} else {
			await fs.promise.unlink(req.filePath)
		}
		req.action = ACTION_DELETE
		res.end()
		next()
	}().catch(next)
}, syncClients)

app.post('*', setFileMeta, setDirDetails, (req, res, next) => {
	async ()=> {
		if(req.stat) return res.send(405, 'File exists')
		await mkdirp.promise(req.dirPath)
		if(!req.isDir) req.pipe(fs.createWriteStream(req.filePath))
		res.end()
		req.action = ACTION_CREATE
		next()
	}().catch(next)
}, syncClients)

app.put('*', setFileMeta, setDirDetails, (req, res, next) => {
	async ()=> {
		if(!req.stat) return res.send(405, 'File does not exist')
		if(req.isDir) return res.send(405, 'Path is a directory')
		await fs.promise.truncate(req.filePath, 0)
		req.pipe(fs.createWriteStream(req.filePath))
		res.end()
		req.action = ACTION_UPDATE
		next()
	}().catch(next)
}, syncClients)


function setDirDetails(req, res, next) {
	let endWithSlash = req.filePath.charAt(req.filePath.length-1) === path.sep
	console.log('endWithSlash' + endWithSlash)
	console.log('req.filePath.charAt(req.filePath-1)' + req.filePath.charAt(req.filePath-1))
	console.log('path.sep' + path.sep)
	let hasExt = path.extname(req.filePath) !== ''
	console.log('hasExt' + hasExt)
	req.isDir = endWithSlash || !hasExt
	console.log('req.isDir' + req.isDir)
	req.dirPath = req.isDir ? req.filePath : path.dirname(req.filePath)
	next()
}

function setFileMeta (req, res, next) {
	req.filePath = path.resolve(path.join(ROOT_DIR, req.url))
	if(req.filePath.indexOf(ROOT_DIR) !== 0) {
		res.send(400, 'Invalid path')
		return
	}
	fs.promise.stat(req.filePath)
		.then(stat => req.stat = stat, () => req.stat = null)
		.nodeify(next)
}

function sendHeaders(req, res, next) {
	nodeify(async ()=> {
		if(req.stat){
			if(req.stat.isDirectory()){
				let files = await fs.promise.readdir(req.filePath)
				res.body = JSON.stringify(files)
				res.setHeader('Content-Length', res.body.length)
				res.setHeader('Content-Tyoe', 'application/json')
				return
			}
			res.setHeader('Content-Length', req.stat.size)
			let contentType = mime.contentType(path.extname(req.filePath))
			res.setHeader('Content-Tyoe', contentType)
		}
	}(), next)
}

//Creating a tcp server and register all clients
let tcpServer = jot.createServer(TCP_PORT)
tcpServer.listen(TCP_PORT, ()=> console.log(`TCP Server LISTENING @ 127.0.0.1:${TCP_PORT}`))
tcpServer.on('connection', (socket) => {
	socket.on('data', (data) => {
		console.log("TCP Connection from client: " + data.clientId + ". Registering the client with server to get sync requests.")
	})
	clientSocketList.push(socket)
})

function syncClients(req, res, next) {
	async ()=> {
		let type = req.isDir ? TYPE_DIR : TYPE_FILE
		let contents

		if(!req.isDir && req.action !== ACTION_DELETE) {
			contents = await fs.promise.readFile(req.filePath)
			console.log(contents)
		}
		let stat = (req.action !== ACTION_DELETE) ? await fs.promise.stat(req.filePath) : null

		let updatedTime = stat ? stat.mtime : new Date()


		for (let i = 0; i < clientSocketList.length; i++) {
			clientSocketList[i].write(
				{
					"action": req.action,
					"path": req.url,
					"type": type,
					"contents": contents,
					"updated": updatedTime
				}
			)
		}
	}().catch(next)
}
