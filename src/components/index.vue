<template>
  <div class="content">
    <h1>Agent: {{acc}}</h1>
    <div>
      Send message to : {{sendTarget.target}}
      <br>
      <input type="text" v-model="msg" />
      <button type="button" @click="announce()" :disabled="sendTarget.target == 'Someone'">送出</button>
    </div>
    <div class="serverlist">
      <div class="container">
        <div id="server-status">伺服器狀態：</div>
        <div class="button">
          <button type="button" @click="send({type:'all', target:'all'})">發送訊息至伺服器</button>
          <button type="button" @click="offlineAll()">強制登出伺服器全使用者</button>
        </div>
      </div>
      <table>
        <tr>
          <th width="15%">Lobby</th>
          <th width="15%">Chat Room 1</th>
          <th width="15%">Chat Room 2</th>
          <th width="15%">Total</th>
        </tr>
        <tr>
          <td>{{roomCount.Lobby}}</td>
          <td>{{roomCount.ChatRoom1}}</td>
          <td>{{roomCount.ChatRoom2}}</td>
          <td>{{totalCount}}</td>
        </tr>
        <tr>
          <td>
            <button type="button" @click="send({type:'room', target:'Lobby'})" :disabled="roomCount.Lobby == 0">發送訊息</button>
          </td>
          <td>
            <button type="button" @click="send({type:'room', target:'ChatRoom1'})" :disabled="roomCount.ChatRoom1 == 0">發送訊息</button>
          </td>
          <td>
            <button type="button" @click="send({type:'room', target:'ChatRoom2'})" :disabled="roomCount.ChatRoom2 == 0">發送訊息</button>
          </td>
        </tr>
        <tr>
          <td></td>
          <td>
            <button type="button" @click="kickRoom('ChatRoom1')" :disabled="roomCount.ChatRoom1 == 0">清空該房</button>
          </td>
          <td>
            <button type="button" @click="kickRoom('ChatRoom2')" :disabled="roomCount.ChatRoom2 == 0">清空該房</button>
          </td>
        </tr>
      </table>
    </div>
    <column-chart style="margin-top='5px;'" :data="toChart" :donut="true" width="630px" height="220px" xtitle="Room" ytitle="Population"></column-chart>
    <div class="userlist">
      <h2>使用者狀態：</h2>
      <table>
        <tr>
          <th width="3%">ID</th>
          <th width="8%">Account</th>
          <th width="8%">Status</th>
          <th width="15%">Chat Room 1</th>
          <th width="15%">Chat Room 2</th>
          <th width="10%"></th>
          <th width="10%"></th>
        </tr>
        <tr v-for="user in userList">
          <td>{{user.id}}</td>
          <td>{{user.acc}}</td>
          <td>
            <span class="offline" v-if="user.room.length == 0">離線中</span>
            <span class="online" v-if="user.room.length > 0">上線中</span>
          </td>
          <td>
            <button type="button" @click="kickUser({id:user.id,target:'ChatRoom1'})" :disabled="!user.room.includes('ChatRoom1')">踢出該房</button>
          </td>
          <td>
            <button type="button" @click="kickUser({id:user.id,target:'ChatRoom2'})" :disabled="!user.room.includes('ChatRoom2')">踢出該房</button>
          </td>
          <td>
            <button type="button" @click="offlineUser(user.id)" :disabled="user.room.length == 0">強制離線</button>
          </td>
          <td>
            <button type="button" @click="send({type:'user', target:user.id})" :disabled="user.room.length == 0">發送訊息</button>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        agent: false,
        broadcast: false,
        acc: "",
        userList: [],
        msg: "",
        roomCount: {
          Lobby: 50,
          ChatRoom1: 60,
          ChatRoom2: 80
        },
        sendTarget: {
          target: "Someone"
        },
      };
    },
    computed: {
      totalCount: function() {
        let roomCount = this.roomCount;
        return roomCount.Lobby + roomCount.ChatRoom1 + roomCount.ChatRoom2;
      },
      toChart: function() {
        let retData = [];
        for (let room of Object.keys(this.roomCount)) {
          let ret = [room, this.roomCount[room]];
          retData.push(ret);
        }
        return retData;
      }
    },
    methods: {
      send(target) {
        this.sendTarget = target;
      },
      announce() {
        this.sendTarget.msg = this.msg;
        this.$socket.emit("send", this.sendTarget);
      },
      kickUser(target) {
        this.$socket.emit("kick", {
          targetType: 'user',
          roomType: 'room',
          id: target.id,
          room: target.target
        });
      },
      kickRoom(target) {
        this.$socket.emit("kick", {
          targetType: 'room',
          room: target
        });
      },
      offlineUser(target) {
        this.$socket.emit("kick", {
          targetType: 'user',
          roomType: 'all',
          target: target
        });
      },
      offlineAll() {
        this.$socket.emit("kick", {
          targetType: 'all',
        });
      }
    },
    sockets: {
      redirect(destination) {
        alert("權限不足或尚未登入!");
        window.location.replace(destination);
      },
      login(retData) {
        this.agent = true;
        this.userList = retData.userList;
        this.roomCount = retData.roomCount;
      },
      agent(acc) {
        this.acc = acc
      },
    },
    mounted() {
      localStorage.setItem("token", window.name);
      if (window.name != '') {
        localStorage.setItem('token', window.name);
      }
      this.$socket.emit("checkToken", localStorage.token);
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .content {
    font-family: Microsoft JhengHei;
  }
  button {
    padding-top: 0;
  }
  .container button {
    margin: 0 5px 0 10px;
  }
  .container {
    margin: 20px 0 20px 0;
    display: flex;
    align-items: center;
    height: 30px;
  }
  #server-status {
    height: 32px;
    line-height: 36px;
    font-size: 1.5em;
    font-weight: bold;
  }
  .serverlist {
    text-align: center;
  }
  .userlist h2 {
    text-align: left;
  }
  .userlist {
    text-align: center;
  }
  .offline {
    color: red;
  }
  .online {
    color: green;
  }
</style>
