const express = require('express')
const bodyParser = require('body-parser')
const FileSync = require('lowdb/adapters/FileSync')
const low = require('lowdb')

require('dotenv').config()

const app = express()

const adapter = new FileSync('db.json')
const db = low(adapter)
db.defaults({ documents: [], users: []})
  .write()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Middleware for debug
app.use((req, res, next) => {
    console.info("Access to", req.url, req.method)
    next()
})

app.post('/users/create', (req, res) => {

    const { username, password} = req.body

    if (username && password) {
        const userExists = db.get('users')
          .filter({ username })
          .value()

        if (userExists.length) {
            res.status(402).send({message: "Username is already registered."})
        } else {
            db.get('users')
            .push({ username, password})
            .write()
            res.status(201).send({ username })
        }
    } else {
        res.status(403).send({message: "Invalid request"})
    }
})

app.get('/users/auth', (req, res) => {
    const user = authorize(
        req.headers["x-auth-user"], req.headers["x-auth-key"])
    user 
        ? res.status(200).send({authorized: "OK"}) 
        : res.status(401).send({message: "Unauthorized"})
})

app.put('/syncs/progress', (req, res) => {
    
    const username = authorize(
        req.headers["x-auth-user"], req.headers["x-auth-key"])

    if (username) {
        
        const timestamp = +new Date()
        const {
            percentage,
            progress,
            device,
            device_id,
            document
        } = req.body
    
        if (document) {
            if (percentage && progress && device) {
                const recordExists = db.get('documents')
                    .filter({ key: username + document })
                    .value()

                if (recordExists.length) {
                    db.get('documents')
                        .find({ key: username + document })
                        .assign({ 
                            key: username + document,
                            percentage,
                            progress,
                            device,
                            device_id,
                            timestamp
                        })
                        .write()

                } else {
                    db.get('documents')
                        .push({ 
                            key: username + document,
                            percentage,
                            progress,
                            device,
                            device_id,
                            timestamp
                        })
                        .write()
                }
                res.status(200).send({document, timestamp})
            }
        } else {
            res.status(403).send({message: "Field 'document' not provided."})
        }
    } else {
        res.status(401).send({message: "Unauthorized"})
    }
})

app.get('/syncs/progress/:document', (req, res) => {

    
    const username = authorize(
        req.headers["x-auth-user"], req.headers["x-auth-key"])
    const document = req.params.document
        
    if (username) {

        if (document) {
            const doc = db.get('documents')
                .filter({ key: username + document })
                .value()

            if (doc.length) {
                res.status(200).send(doc[0])
            } else {
                res.status(502).send({message: "Unknown server error."})
            }

        } else {
            res.status(403).send({message: "Field 'document' not provided."})
        }
        
    } else {
        res.status(401).send({message: "Unauthorized"})
    }
})

app.get('/healthcheck', (req, res) => {
    res.status(200).send({state: "OK"})
})

function authorize(user, password) {
    if (user && password) {
        const res = db.get('users')
            .find({ username: user })
            .value()

        if (res && res.password === password) {
            return user
        }
    }
}

app.listen(process.env.SERVER_PORT, process.env.SERVER_HOST, () => {
    console.info(`Koreader server listening on port ${process.env.SERVER_PORT}!`)
})