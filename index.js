const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

const asyncredis = require("async-redis");
const client = asyncredis.createClient(6379, "127.0.0.1");

const redis = require("redis");
const redisClient = redis.createClient;
const pub = redisClient({
  port: 6379,
  host: "127.0.0.1"
});
const sub = redisClient({
  port: 6379,
  host: "127.0.0.1"
});

const mysql = require("mysql");
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "company"
});

const roomList = ["Lobby", "ChatRoom1", "ChatRoom2"];

// const emoji = require("node-emoji");

app.use(express.static(__dirname + "/dist"));
app.get("/", function (req, res) {
  res.sendfile("index.html");
});

function getTotalUsers(agentID) {
  let sql = "select id, Account from login where Agent = ? order by id";
  con.query(sql, [agentID], async (err, result) => {
    let totalUsers = JSON.parse(JSON.stringify(result));
    await client.set(`Agent:${agentID}:UserList`, JSON.stringify(totalUsers));
  });
}

async function getLoginStatus(agentID) {
  let totalUsers = await client.get(`Agent:${agentID}:UserList`);
  totalUsers = JSON.parse(totalUsers);
  let userList = [];
  let ret = {};
  let status = await client.get(`Agent:${agentID}:Login:Status`);
  status = JSON.parse(status);
  for (let user of totalUsers) {
    if (status != null && status.includes(user.id)) {
      let userStatus = await client.get(`Agent:${agentID}:Login:User:${user.id}`);
      userStatus = JSON.parse(userStatus);
      ret = {
        id: user.id,
        acc: user.Account,
        room: userStatus.room
      }
    } else {
      ret = {
        id: user.id,
        acc: user.Account,
        room:[]
      }
    }
    userList.push(ret);
  }
  let roomCount = {};
  for(let room of roomList){
    let roomStatus = await client.get(`Agent:${agentID}:Room:${room}:Count`);
    if(roomStatus == null){
      roomCount[room] = 0;
    } else {
      roomCount[room] = parseInt(roomStatus);
    }
  }
  let retData = {
    userList:userList,
    roomCount:roomCount
  }
  return retData;
}

io.on("connection", function (socket) {
  socket.on("checkToken", async token => {
    let info = await client.get(token);
    info = JSON.parse(info);
    if (info == null) {
      let destination = "http://192.168.0.123";
      socket.emit("redirect", destination);
    } else {
      socket.emit("agent", info.Name);
      if (info.Agent == 1) {
        sub.subscribe("ChatChannel3000");
        getTotalUsers(info.id);
        setTimeout(async () => {
          let result = await getLoginStatus(info.id);
          socket.emit("login", result);
        }, 300);
      } else {
        let destination = "http://192.168.0.123";
        socket.emit("redirect", destination);
      }
    }
  });

  socket.on("send", function (target) {
    pub.publish(
      "ChatChannel3000",
      JSON.stringify({
        event: "announce",
        target: target
      })
    );
  });

  socket.on("kick", function (target) {
    pub.publish(
      "ChatChannel3000",
      JSON.stringify({
        event: "kick",
        target: target
      })
    );
  });

  sub.on("message", async (channel, message) => {
    message = JSON.parse(message);
    switch (message.event) {
      case "loginStatus":
        let result = await getLoginStatus(message.agentID);
        socket.emit("login", result);
        break;
      default:
        break;
    }
  });
});

server.listen(3010, () => {
  console.log("Server Started. http://localhost:3010");
});
