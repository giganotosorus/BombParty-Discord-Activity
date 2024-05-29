const DiscordRPC = require('discord-rpc');
const WebSocket = require("ws");
const http = require("http"); // Récupération des dépendances

const clientId = '1102163637541556264'; // ID de l'application Discord


DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'ipc' }); // Création du client RPC

const server = http.createServer((req, res) => { // Création du serveur HTTP
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("RPC server is running");
});

let previousCode; // Variable pour stocker le code de la partie précédente
let timeStamps; // Variable pour stocker le timestamp de la partie
function setActivity(rpc, code, inGame, startTimestamp) { // Fonction pour mettre à jour l'activité du RPC

    rpc.setActivity({
        pid: process.pid, // ID du processus
        details: inGame ? "En jeu" : "En attente", // Détails de l'activité
        state: `code: ${code}`, // Code de la partie
        startTimestamp: startTimestamp, // Timestamp de début de la partie
        largeImageKey: inGame ? 'bombe' : "jklm", // Image affichée
        largeImageText: inGame ? 'Bomb Party' : 'JKLM.fun', // Texte affiché
        smallImageKey: inGame ? 'jklm' : 'bombe', // Image affichée en petit
        smallImageText: inGame ? 'JKLM.fun' : 'Bomb Party', // Texte affiché en petit
        instance: false, // Instance unique
        buttons: [{ label: "Rejoindre", url: `https://jklm.fun/${code}` }, { label: "Discord", url: "https://youtu.be/dQw4w9WgXcQ" }] // Boutons
    });
}

rpc.on('ready', () => { // Attend que le client RPC soit prêt
    const ws = new WebSocket.Server({ server }); // Création du serveur WebSocket

    ws.on('connection', ws => { // Attend la connexion d'un client
        console.log("Client connecté");
        ws.on('message', message => { // Attend un message du client
            const data = JSON.parse(message); // Parse le message en JSON
            if (data.active) { // Vérifie si l'activité se lance ou se ferme
                if (data.code) { // Récupère l'url d'envoie de la requête
                    if (data.code === "games") { // Vérifie si l'url est bien le code de la partie ou si elle vient du jeu
                        data.code = previousCode; // Récupère le code de la partie précédente
                        if (data.timeStamps) {
                            timeStamps = new Date(data.timeStamps); // Convertit le timestamp en date
                        } else {
                            timeStamps = new Date(); // Crée un nouveau timestamp
                        }
                    } else {
                        previousCode = data.code; // Stocke le code de la partie
                        if (!timeStamps) {
                            timeStamps = new Date();
                        }
                    }
                    setActivity(rpc, data.code, data.inGame, timeStamps); // Met à jour l'activité du RPC
                }
            } else {
                timeStamps = null; // Réinitialise le timestamp
                rpc.clearActivity(); // Efface l'activité du RPC
            }
        });
    });
    server.listen(8005, () => { // Lance le serveur sur le port 8005
        console.log("Attente de la connexion d'un client...")
    });

});

rpc.login({ clientId }).catch(console.error); // Connexion au client RPC


