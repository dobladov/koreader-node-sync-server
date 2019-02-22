# Koreader node sync server
Self hostable synchronization service for koreader devices for node.js


## Instalation

```
git clone https://github.com/dobladov/koreader-node-sync-server.git
cd koreader-node-sync-server
npm install
```

## Configuration

Create a `.env` file in the root directory with this content

```
SERVER_HOST=0.0.0.0
SERVER_PORT=3000
```

Create the certificates

```
mkdir certificates
openssl req -nodes -new -x509 -keyout certificates/server.key -out certificates/server.cert
```

Run the server

```
npm start
```

Check that is running

```
curl -k https://localhost:3000/healthcheck
```

Set your Koreader url to [https://localhost:3000](https://localhost:3000)
