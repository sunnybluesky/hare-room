
import { loginProcess, el, user } from "/js/main.js"
// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyBFSGOmkbvO0KMDR1patd5hVZltv9L9ppk",
  authDomain: "harezora-sites-test.firebaseapp.com",
  projectId: "harezora-sites-test",
  storageBucket: "harezora-sites-test.firebasestorage.app",
  messagingSenderId: "625363638917",
  appId: "1:625363638917:web:a9f3a3468a0921401427ec",
  measurementId: "G-SZD27856HY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app)

// --- DOM ---
if (document.getElementById('google-sign-in') !== null) {
  const googleBtn = document.getElementById('google-sign-in')
  googleBtn.addEventListener('click', async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      userInfo.textContent = `Google signed in: ${user.displayName} (${user.email})`;
    } catch (err) {
      userInfo.textContent = `Error: ${err.message}`;
    }
  });
}

//const signOutBtn = document.getElementById('sign-out');
let userInfo = document.getElementById('user-info');
if (userInfo == null) {
  userInfo = document.createElement("div")
}
const signOutBtn = document.getElementById("sign-out-btn")
/* --- イベント ---
signUpBtn.addEventListener('click', async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, emailEl.value, passwordEl.value);
    userInfo.textContent = `Signed up: ${userCredential.user.email}`;
  } catch (err) {
    userInfo.textContent = `Error: ${err.message}`;
  }
});
*/
/*
signInBtn.addEventListener('click', async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, emailEl.value, passwordEl.value);
    userInfo.textContent = `Signed in: ${userCredential.user.email}`;
  } catch (err) {
    userInfo.textContent = `Error: ${err.message}`;
  }
});
*/

if (signOutBtn !== null) {
  signOutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      userInfo.textContent = 'Signed out';
      alert("You've signed out.")
    } catch (err) {
      userInfo.textContent = `Error: ${err.message}`;
    }
  });
}

// --- 認証状態監視 ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    user.isLogin = true
    userData = user
    loginProcess()
    userInfo.textContent = `User: ${user.displayName || user.email} (UID: ${user.uid})`;



  } else {
    console.log("Not signed in!", user)
    userInfo.textContent = 'Not signed in';
  }
});

// Github

const githubProvider = new GithubAuthProvider();
// 必要なスコープを追加（例: メール取得）
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

export async function signInWithGitHubPopup() {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    // サインインユーザー情報
    const user = result.user;
    // GitHub のアクセストークン
    const credential = GithubAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken ?? null;

    return { user, accessToken };
  } catch (error) {
    // エラー処理（例: popup closed by user, auth/cancelled-popup-request）
    throw error;
  }
}

if (document.getElementById('github-sign-in') !== null) {
  document.getElementById('github-sign-in').addEventListener('click', async () => {
    try {
      const { user, accessToken } = await signInWithGitHubPopup();
      console.log('Signed in user:', user);
      console.log('GitHub access token:', accessToken);
      userInfo.textContent = `User: ${user.displayName || user.email} (UID: ${user.uid})`;


    } catch (err) {
      console.error('Sign-in error:', err);
      userInfo.textContent = err;
    }
  })
}
export async function logOut() {
  var c = confirm("ログアウトしますか?")
  if (c) {
    try {
      await signOut(auth);
      userInfo.textContent = 'Signed out';
      alert("You've signed out.")
    } catch (err) {
      userInfo.textContent = `Error: ${err.message}`;
    }
  }
}

function listenToDocument(collectionName, docId, callback) {
  const docRef = doc(db, collectionName, docId);
  console.log(docRef)
  // onSnapshot は最初の取得も「added」イベントとして呼び出す点に注意
  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        // ドキュメントが削除されたか、まだ存在しない
        callback(null, "removed");
        return;
      }

      const data = { id: snapshot.id, ...snapshot.data() };
      const changeType = snapshot.metadata.hasPendingWrites ? "added" : "modified";
      // メタデータで「ローカル書き込み」かどうかを判定できるが、単純に「modified」でも可
      callback(data, changeType);
    },
    (error) => {
      console.error("Firestore listener error:", error);
    }
  );

  return unsubscribe; // 後で `unsubscribe()` すればリスナー停止
}


export class ChatRoom {
  data = {}
  roomId = ""
  messageNumber = 0
  el = {
    list: document.querySelector(".chat-frame > ul"),
    input: document.querySelector("#message-input"),
    roomName: document.querySelector(".chat-room-name"),
  }
  getRoomData = async function (roomId = "main", doDisplay = false) {
    const docRef = doc(db, "chat", roomId);   // コレクション + ID の参照を作成
    const snap = await getDoc(docRef).catch((err) => {
      console.log(err)
    })              // Promise が解決するまで待つ
    //return snapshot
    const data = { id: snap.id, ...snap.data() };

    if (doDisplay) {
      console.log(data)
    }
    this.data = data
    this.fullDisplayChat(data)
    this.messageNumber = this.getMessageNumber(data)
  }
  convertToArray(data) {
    var arr = []
    var len = this.getMessageNumber(data)
    for (var i = 0; i < len; i++) {
      arr.push(data[i])
    }
    return arr
  }
  fullDisplayChat(data) {
    var len = this.getMessageNumber(data)
    this.el.list.innerHTML = ""
    var arr = this.convertToArray(data)
    console.log(arr)
    for (var i = 0; i < len; i++) {
      var el = document.createElement("li")
      el.classList.add("list-group-item")
      el.id = "chat-" + i

      var time = arr[i].time.seconds * 1000 //秒からミリ秒に
      time = new Date(time)

      var timeString = `${time.getMonth()+1}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}`

      //HTML部分
      el.innerHTML = `<div><span>${arr[i].name} : ${arr[i].msg}</span>
                      <span class="chat-date-text">${timeString}</span></div>`
      this.el.list.append(el)

    }
  }
  getMessageNumber(data = this.data) {
    return ((Object.keys(data).length) - 2)
    //メッセージからidとconfigの項目を差し引いた値
  }
  displayChat() {

  }

  async addMessage(msg = "???") {
    const mainRef = doc(db, "chat", this.roomId);
    const NUMBER = this.getMessageNumber() + ""
    const timeStamp = new Date()
    const id = userData.uid
    const format = {
      color: "default"
    }//書式

    await setDoc(
      mainRef,
      {
        [NUMBER]: { name: user.name, msg: msg, time: timeStamp, format: format, id: id },
      },
      { merge: true }               // 既存フィールドは残す
    );
  }

  constructor(room = "main") {
    this.roomId = room

    this.el.input.addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        var text = this.el.input.value + ""
        this.el.input.value = ""
        this.addMessage(text)

      }
    })

    const stop = listenToDocument("chat", room, (data, type) => {
      if (type === "removed") {
        console.log("ドキュメントが削除されました");
        return;
      }

      console.log(`ドキュメントが ${type} されました`);
      this.data = data
      this.getRoomData("main", false)
      
      var roomName = window.chatData.data.config.roomName
      this.el.roomName.textContent = `Chat - ${roomName}`
    });
  }
}

// 62進の文字セット: 0-9, a-z, A-Z を割り当て
const DIGITS62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * 62進文字列を10進数(BigInt)に変換する
 * @param {string} s - 62進表記の文字列（例: "paeSxnibpnUnXpd26gqsiaOoIWg1"）
 * @returns {BigInt} 10進数としての値
 * @throws {Error} 無効な文字が含まれる場合
 */
function base62ToBigInt(s) {
  if (typeof s !== "string" || s.length === 0) throw new Error("非空の文字列を指定してください。");

  const map = new Map();
  for (let i = 0; i < DIGITS62.length; i++) map.set(DIGITS62[i], BigInt(i));

  let result = 0n;
  const base = 62n;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const digit = map.get(ch);
    if (digit === undefined) throw new Error(`無効な文字: ${ch}`);
    result = result * base + digit;
  }
  return result;
}

// 使用例
const input = "paeSxnibpnUnXpd26gqsiaOoIWg1";
console.log(base62ToBigInt(input).toString(10)); // 10進数文字列として表示
