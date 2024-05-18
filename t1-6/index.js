const http = require('http')

const { Router, createRoute } = require('./routes/router')
const { rootRoute } = require('./routes/rootRoutes')

const router = new Router(rootRoute)

const server = http.createServer((req, res) => {
    router.execute(req, res).catch(e => {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
    })
})

server.listen(3000, () => {
    console.log('Listening on port 3000')
})