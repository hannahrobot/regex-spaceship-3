const { Task } = require("../db/models");

let serverState = {
  users: [],
  randomTasks: [],
  scores: {},
  gameScore: 0,
};

const players = {};
let numPlayers = 0;

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(numPlayers);
    console.log(
      `A socket connection to the server has been made: ${socket.id}`
    );
    players[socket.id] = {
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      team: Math.floor(Math.random() * 2) == 0 ? "red" : "blue",
    };

    //add to player to scores obj
    serverState.scores[socket.id] = { name: "", points: 0 };

    numPlayers = Object.keys(players).length;
    console.log(numPlayers);
    // send the players object to the new player
    socket.emit("currentPlayers", { players, numPlayers });
    // set initial state
    socket.emit("setState", serverState);
    // update all other players of the new player
    socket.broadcast.emit("newPlayer", {
      playerInfo: players[socket.id],
      numPlayers: numPlayers,
    });
    // when a player disconnects, remove them from our players object
    socket.on("disconnect", function () {
      console.log("user disconnected: ", socket.id);
      // remove this player from our players object
      delete players[socket.id];
      //remove player from scores obj
      delete serverState.scores[socket.id];
      numPlayers = Object.keys(players).length;
      console.log(numPlayers);
      // emit a message to all players to remove this player
      io.emit("disconnected", { playerId: socket.id, numPlayers });
    });
    // when a player moves, update the player data
    socket.on("playerMovement", function (movementData) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].rotation = movementData.rotation;
      // emit a message to all players about the player that moved
      socket.broadcast.emit("playerMoved", players[socket.id]);
    });

    socket.on("completedTask", function (completedTaskId) {
      serverState.gameScore++;
      io.emit("progressUpdate", {
        gameScore: serverState.gameScore,
        completedTaskId,
      });
    });

    //update score
    socket.on("scoreUpdate", function (scoreObj) {
      serverState.scores[socket.id].points += scoreObj.points;
      if (scoreObj.timeBonus) {
        serverState.scores[socket.id].points += scoreObj.timeBonus;
      }
      io.emit("updateLeaderboard", serverState.scores);
    });

    socket.on("sendTime", function (time) {
      socket.emit("sendTimeToRegex", time);
    });

    socket.on("sendScores", function (playerInfo) {
      serverState.scores[socket.id] = playerInfo;
      io.emit("displayScores", serverState.scores);
    });

    socket.on("startGame", async function () {
      try {
        const tasks = await Task.findAll();
        const randomIdOne = Math.ceil(Math.random() * tasks.length);
        const randomIdTwo = Math.ceil(Math.random() * tasks.length);
        const taskOne = await Task.findByPk(randomIdOne);
        const taskTwo = await Task.findByPk(randomIdTwo);
        serverState.randomTasks = [taskOne, taskTwo];

        io.emit("updateState", serverState);
        io.emit("destroyButton");
        io.emit("startTimer");
      } catch (err) {
        console.log("error starting game", err);
      }
    });

    // get a random code for the room
    socket.on("getRoomCode", async function () {
      try {
        let code = "";
        let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
        for (let i = 0; i < 5; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        console.log("here's a random code!: ", code);
      } catch (err) {
        console.log("there was an error getting a room code", err);
      }
    });

    socket.on("disablePanel", function (controlPanel) {
      socket.broadcast.emit("setInactive", controlPanel);
    });
  });
};
