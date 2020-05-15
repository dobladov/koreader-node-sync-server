# Koreader node sync server
Self hostable synchronization service for koreader devices for node.js

## Instalation

```
git clone https://github.com/dobladov/koreader-node-sync-server.git
cd koreader-node-sync-server
npm install
```

## Optional Configuration

Create a `.env` file in the root directory with this content

```
SERVER_HOST=0.0.0.0
SERVER_PORT=3000
CERTIFICATES_FOLDER = './certificates'
```

Create the certificates for https

```
mkdir certificates
openssl req -nodes -new -x509 -keyout certificates/server.key -out certificates/server.cert
```

## Run the server

```
npm start
```

## Check if is running

```
curl -k http://localhost:3000/healthcheck
```

Set your Koreader url to [http://localhost:3000](http://localhost:3000)
