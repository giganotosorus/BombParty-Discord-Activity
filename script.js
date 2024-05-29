// ==UserScript==
// @name         Activité Discord
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Permet d'avoir une activité Discord avec BombParty
// @author       giganotosorus mort
// @match        https://jklm.fun/*
// @match        https://*.jklm.fun/games/bombparty/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jklm.fun
// @grant        none
// ==/UserScript==

let url = window.location.href.split("/")[3]; // Récupère le code de la partie
let inGame = false;
let selfpeerId;
let timeStamps;
class Socket {
    constructor() {
        this.socket = new WebSocket("ws://localhost:8005"); // Connexion au serveur local
        this.socket.onerror = () => {};
    }

    reconnect() {
        this.socket = new WebSocket("ws://localhost:8005"); // Reconnexion au serveur local
        this.socket.onclose = () => { // Attend que la connexion soit fermée
            setTimeout(() => {
                this.open(); // Attend une seconde avant de se reconnecter
            }, 1000);
        }
    }

    open() {
        this.reconnect();
        this.socket.onopen = () => { // Attend que la connexion soit établie avec le serveur local
            this.emit(true, url, inGame, timeStamps);

            window.addEventListener("beforeunload", () => { //Attend que la page se ferme pour enlever l'activité
                this.emit(false, url, false, null);
            });
        }
    }

    emit(active, url, inGame, timeStamps) { // Méthode pour envoyer les données au serveur local
        try {
            this.socket.send(JSON.stringify({ active: active, code: url, inGame: inGame, timeStamps: timeStamps }));
        } catch (e) {
            // console.log("Message non envoyé", e);
            // console.log(active, url, inGame, timeStamps);
            if (!this.socket) {
                this.reconnect(); //Tentative de reconnexion si le message n'a pas été envoyé
            }
        }
    }
}
let ws = new Socket(); // Création de l'objet Socket

window.addEventListener("load", () => {
    if (url.length === 4) { // Vérifie si l'url est bien le code de la partie
        ws.open();
    }
    if (window.top == window.self) {
        return;

    } else if (window.top != window.self) {
        socket.on("setup", (setup) => { // Récupération des données de la room (Et de la partie s'il y en a une en cours)
            selfpeerId = setup.selfPeerId; // Récupère l'id du joueur
            if (setup.milestone.name === "round" && setup.milestone.playerStatesByPeerId[selfpeerId]) { // Vérifie si le joueur est en jeu
                if (setup.milestone.playerStatesByPeerId[selfpeerId].lives > 0) {
                    setup.milestone.startTime ? timeStamps = setup.milestone.startTime : null; // Vérifie si setup.milestone.starTime existe, si c'est le cas le stocke sinon attribue la valeur null
                    inGame = true;
                } else {
                    inGame = false;
                }
            } else {
                inGame = false;
            }
            ws.emit(true, url, inGame, timeStamps); // Envoie les données au serveur local
        });
        socket.on("setMilestone", (milestone) => { //Récupération des données de la partie
            inGame = false;
            timeStamps = null;
            if (milestone.name == "round" && milestone.playerStatesByPeerId[selfpeerId]) { // Vérifie si le joueur est en jeu
                if (milestone.playerStatesByPeerId[selfpeerId].lives > 0) { // Vérifie si le joueur à encore des vies
                    inGame = true;
                    timeStamps = milestone.startTime;
                }
            }
            ws.emit(true, url, inGame, timeStamps); // Envoie les données au serveur local
        });
        socket.on("livesLost", (playerPeerId, newPlayerLives) => {
            if (playerPeerId === selfpeerId && newPlayerLives === 0) { // Vérifie si le joueur à perdu
                inGame = false;
                timeStamps = null;
                ws.emit(true, url, inGame, timeStamps); // Envoie les données au serveur local
            }
        });
        socket.onclose = () => {
            ws.emit(false, url, false, null); // Supprime l'activité si jklm.fun crash
        }
    }
});

