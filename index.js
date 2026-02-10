//httpサーバーとsocket.ioのセットアップ
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const colors = require('colors');

const adminIds = [];

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
  res.sendFile(__dirname + '/');
});
// 1. 関数を定義する
function connect(socket) {
  console.log('ユーザーが接続しました:', socket.id);
  io.to(socket.id).emit("res-ok")
}
function disconnect(socket){
  console.log('ユーザーは切断されました:', socket.id);

}
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
  socket.on("check-ip",(ip)=>{
    if(adminIds.length == 0){
      setTimeout(()=>{
        io.to(socket.id).emit("callback",("check-ip",ip))
      },100)
    }else{
      console.log("sent ip : " + ip)
      if(adminIds.indexOf(ip) == -1){
        console.log("The ip address is not matched with them of admin.".red)
      }else{
        console.log("matched!!!".blue)
        io.to(socket.id).emit("admin-verified")
      }
    }
  })
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

const { google } = require('googleapis');
const path = require('path');

async function getSheetValues() {
  // 認証設定
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'turnkey-energy-481507-a4-3360f6d5793e.json'), // ダウンロードしたJSONパス
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const spreadsheetId = '1lqzR6OCwLsKah7sTxkc5eE4CdVTa_wDNce4no3rfs34';
  const range = 'シート1!A1:ZZZ1000'; // ここで範囲を指定

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('データが見つかりませんでした。');
      return;
    }

    setUpSheetData(rows)
    // 取得したデータの表示
  } catch (err) {
    console.error('APIエラー:', err);
  }
}
getSheetValues();
function setUpSheetData(arr){
  //AdminのIPアドレス取得
  for(var i=0;i<arr[1].length;i++){
    if(i == 0){
      continue;
    }else{
      adminIds.push(arr[1][i])
    }
  }

  console.log(adminIds)


  io.emit("reload")
}