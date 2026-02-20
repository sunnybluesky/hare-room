import { ChatRoom, logOut } from "/js/account.js"

export const user = {
    iconSrc: "",
    name: "Anonymous",
    id:null,
}
export const el = {
    btn: {
        login: document.querySelector("#login-btn"),
        logout: document.querySelector(".logout-btn")
    },
    chat: {
        frame: document.querySelector(".chat-frame"),
        list: document.querySelector(".chat-frame > ul")
    }
}

el.btn.login = document.querySelector("#login-btn")
//ログイン処理
if (el.btn.login == null) {
    location.reload()
}
el.btn.login.addEventListener("click", () => {
    var src = "login.html"
    var hoge = document.createElement("a")
    hoge.href = src
    hoge.click()
})
el.btn.logout.addEventListener("click", () => {
    logOut()
    location.reload()
})


export function loginProcess() {
    console.log("You logined :)", userData)
    document.querySelector(".user-menu").classList.remove("hide")
    document.querySelector(".login").classList.add("hide")
    user.name = userData.displayName
    user.iconSrc = userData.photoURL
    var els = document.querySelectorAll(".user-name")
    for (var el of els) {
        el.textContent = user.name
    }
    document.querySelector(".user-icon").src = user.iconSrc
}

let themeToggle = document.getElementById('theme-toggle');
const root = document.documentElement;
const storageKey = 'theme-preference';
window.onload = () => {
    themeToggle = document.getElementById('theme-toggle');

}
function applyTheme(theme) {
    if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = `<img src="img/sun_icon.svg">`;
    } else {
        root.removeAttribute('data-theme');
        themeToggle.innerHTML = `<img src="img/moon_icon.svg">`;
    }
}

/* 初期判定：保存された設定 → OS設定 → ライト */
function initTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        applyTheme(saved);
        return;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
}

/* トグル操作 */
themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem(storageKey, newTheme);
    applyTheme(newTheme);
});

/* OS設定の変化を反映（ユーザーが未選択の場合のみ）*/
if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', e => {
        if (!localStorage.getItem(storageKey)) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

initTheme();


const rooms = []
if (location.pathname.indexOf("chat.html") !== -1) {
    var searchQueries = {}
    if(location.search !== ""){
        var list = location.search.split("?")[1].split("&")
        for(var item of list){
            var arr = item.split("=")
            searchQueries[arr[0]] = arr[1]
        }
    }

    var roomname = ""

    if(searchQueries.room == undefined){
        roomname = "main"
    }else{
        roomname = searchQueries.room
    }

    //チャットページなら起動
    const chat = new ChatRoom(roomname)
    rooms.push(chat)
    window.chatData = chat
}