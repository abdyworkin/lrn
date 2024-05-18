const url = require('url')

const defaultController = () => {
    throw new Error("Unimplemented controller")
}

const ANY = 'ANY' // ладно

const createRouteWithMethod = (path, controller = defaultController, subroutes = [], method = ANY) => {
    return {
        path,
        controller,
        subroutes,
        method
    }
}

const createRoute = {
    get: (path, controller, subroutes) => createRouteWithMethod(path, controller, subroutes, 'GET'),
    post: (path, controller, subroutes) => createRouteWithMethod(path, controller, subroutes, 'POST'),
    put: (path, controller, subroutes) => createRouteWithMethod(path, controller, subroutes, 'PUT'),
    delete: (path, controller, subroutes) => createRouteWithMethod(path, controller, subroutes, 'DELETE'),
    patch: (path, controller, subroutes) => createRouteWithMethod(path, controller, subroutes, 'PATCH'),
    any: (path, controller, subroutes) => createRouteWithMethod(path, controller, subroutes)
}


const isParam = str => /^:[A-Za-z]+$/.test(str)
const isValidUrl = url => /^\/(?!.*\/\/)([A-Za-z0-9\-._~%!$&'()*+,;=:@\/]*)$/.test(url)

class Router {
    constructor(rootRoutes = []) {
        this.root = rootRoutes
    }

    async execute(req , res) {
        return new Promise((resolve, reject) => {
            const parsedUrl = url.parse(req.url)
            
            if(!isValidUrl(parsedUrl.pathname)) {
                reject(new Error("Invalid URL"))
            }

            if (parsedUrl.pathname.endsWith('/')) {
                parsedUrl.pathname = parsedUrl.pathname.slice(0, -1)
            }

            const splittedUrl = parsedUrl.pathname.slice(1).split('/')

            let currentRoute = this.root[0]
            let depth = 0

            req.params = {}

            res.send = function(data) {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(data))
            }

            const reqChunks = []
            req.on('data', data => {
                reqChunks.push(data)
            })

            req.on('end', () => {
                req.body = JSON.parse(Buffer.concat(reqChunks).toString())

                for (let rootRoute of this.root) {
                    this._processRoute(rootRoute, splittedUrl, req, res)
                }

                if (!res.handled) {
                    reject(new Error('Route not found'))
                }
            })
        })
    }

    _processRoute(currentRoute, currentPath, req, res) {
        if (res.handled !== undefined) return

        if (isParam(currentRoute.path)) {
            const paramKey = currentRoute.path.slice(1)
            const paramValue = currentPath[0]
            req.params[paramKey] = paramValue
        } else if (currentRoute.path !== currentPath[0]) {
            return
        }

        if (currentPath.length > 1) {
            for (let subroute of currentRoute.subroutes) {
                this._processRoute(subroute, currentPath.slice(1), req, res)
            }
        } else {
            if(currentRoute.method === ANY || currentRoute.method === req.method) {
                currentRoute.controller(req, res)
                res.handled = true
            }
        }
    }
}


module.exports = {
    Router,
    createRoute
}