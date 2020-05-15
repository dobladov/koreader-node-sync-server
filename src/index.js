const express = require('express')
const bodyParser = require('body-parser')
const http = require('http')
const https = require('https')
const fs = require('fs')
const db = require('./db')

require('dotenv').config()

const app = express()

const {
  SERVER_HOST = 'localhost',
  SERVER_PORT = 3000,
  CERTIFICATES_FOLDER
} = process.env

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Middleware for debug
app.use((req, res, next) => {
  console.info(`Access to ${req.url} ${req.method}`)
  next()
})

/**
 * Creates a new user with the given
 * username and password
 */
app.post('/users/create', (req, res) => {
  const { username, password } = req.body

  if (username && password) {
    const userExists = db.get('users')
      .filter({ username })
      .value()

    if (userExists.length) {
      res.status(402).send({ message: 'Username is already registered.' })
    } else {
      db.get('users')
        .push({ username, password })
        .write()
      res.status(201).send({ username })
    }
  } else {
    res.status(403).send({ message: 'Invalid request' })
  }
})

/**
 * Authorizes the given
 * username and password
 */
app.get('/users/auth', (req, res) => {
  const user = authorize(
    req.header('x-auth-user'), req.header('x-auth-key'))
  user
    ? res.status(200).send({ authorized: 'OK' })
    : res.status(401).send({ message: 'Unauthorized' })
})

/**
 * Updates the progress of a book
 */
app.put('/syncs/progress', (req, res) => {
  const username = authorize(
    req.header('x-auth-user'), req.header('x-auth-key'))

  if (username) {
    const timestamp = +new Date()
    const {
      percentage,
      progress,
      device,
      device_id: deviceID,
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
              device_id: deviceID,
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
              device_id: deviceID,
              timestamp
            })
            .write()
        }
        res.status(200).send({ document, timestamp })
      }
    } else {
      res.status(403).send({ message: "Field 'document' not provided." })
    }
  } else {
    res.status(401).send({ message: 'Unauthorized' })
  }
})

/**
 * Returns the progress fo a given book
 */
app.get('/syncs/progress/:document', (req, res) => {
  const username = authorize(
    req.header('x-auth-user'), req.header('x-auth-key'))
  const { document } = req.params

  if (username) {
    if (document) {
      const doc = db.get('documents')
        .filter({ key: username + document })
        .value()

      if (doc.length) {
        res.status(200).send(doc[0])
      } else {
        res.status(502).send({ message: 'Unknown server error.' })
      }
    } else {
      res.status(403).send({ message: "Field 'document' not provided." })
    }
  } else {
    res.status(401).send({ message: 'Unauthorized' })
  }
})

/**
 * Check if the server is working
 */
app.get('/healthcheck', (req, res) => {
  res.status(200).send({ state: 'OK' })
})

/**
 * Validates if the given password
 * and user name are valid
 * @param {string} user
 * @param {string} password
 */
const authorize = (user, password) => {
  if (user && password) {
    const res = db.get('users')
      .find({ username: user })
      .value()

    if (res && res.password === password) {
      return user
    }
  }
}

const server = CERTIFICATES_FOLDER
  ? https.createServer({
    key: fs.readFileSync('certificates/server.key'),
    cert: fs.readFileSync('certificates/server.cert')
  }, app)
  : http.createServer({}, app)

server.listen(+SERVER_PORT, SERVER_HOST, () => {
  console.info(`Koreader server listening on http${CERTIFICATES_FOLDER ? 's' : ''}://${SERVER_HOST}:${SERVER_PORT}`)
})
