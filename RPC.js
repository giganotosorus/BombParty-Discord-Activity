const DiscordRPC = require('discord-rpc');
const WebSocket = require("ws");
const http = require("http");

const clientId = '1102163637541556264';


DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'ipc' });

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("RPC server is running");
});

let previousCode;
let timeStamps;
function setActivity(rpc, code, inGame, startTimestamp) {

    rpc.setActivity({
        pid: process.pid,
        details: inGame ? "En jeu" : "En attente",
        state: `code: ${code}`,
        startTimestamp: startTimestamp,
        largeImageKey: inGame ? 'bombe' : "jklm",
        largeImageText: inGame ? 'Bomb Party' : 'JKLM.fun',
        smallImageKey: inGame ? 'jklm' : 'bombe',
        smallImageText: inGame ? 'JKLM.fun' : 'Bomb Party',
        instance: false,
        buttons: [{ label: "Rejoindre", url: `https://jklm.fun/${code}` }, { label: "Discord", url: "https://youtu.be/dQw4w9WgXcQ" }]
    });
}

rpc.on('ready', () => {
    const ws = new WebSocket.Server({ server });

    ws.on('connection', ws => {
        console.log("Client connecté");
        ws.on('message', message => {
            const data = JSON.parse(message);
            if (data.active) {
                if (data.code) {
                    if (data.code === "games") {
                        data.code = previousCode;
                        if (data.timeStamps) {
                            timeStamps = new Date(data.timeStamps);
                        } else {
                            timeStamps = new Date();
                        }
                    } else {
                        previousCode = data.code;
                        if (!timeStamps) {
                            timeStamps = new Date();
                        }
                    }
                    setActivity(rpc, data.code, data.inGame, timeStamps);
                }
            } else {
                timeStamps = null;
                rpc.clearActivity();
            }
        });
    });
    server.listen(8005, () => {
        console.log("Attente de la connexion d'un client...")
    });

});

rpc.login({ clientId }).catch(console.error);


