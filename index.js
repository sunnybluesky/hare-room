//httpサーバーとsocket.ioのセットアップ
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const colors = require('colors');

app.use(express.static(__dirname + '/public'));
//3000番ポート
server.listen(3000,() => {
  console.log('');
  console.log('┏━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log('┃ ' + 'Welcome to hare-room! '.rainbow + '┃');
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━┛');
  setTimeout(()=>{
    io.emit("reload")
  },1000)
});
// ルーティングの設定。'/' にリクエストがあった場合 src/index.html を返す
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  connect(socket);
  socket.on('disconnect', () => {
    disconnect(socket);
  });
  //入室
  socket.on('joinRoom', (roomName) => {
    socket.join(roomName);
    console.log(`User joined room: ${roomName}`);
  });

});

//コマンドライン
const readline = require('readline');
const e = require('express');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const commands = {
  help: () => {
    console.log('Available commands: help, exit, messages');
  },
  exit: () => {
    console.log('Bye!');
    rl.close();
  },
  reload: ()=>{
    io.emit("reload")
  }
};

rl.prompt();

rl.on('line', (line) => {
  const command = line.trim().toLowerCase();
  if (commands[command]) {
    commands[command]();
  } else {
    console.log('Unknown command');
  }
  rl.prompt();
});