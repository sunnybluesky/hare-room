function parseQuery(qs) {
  const params = new URLSearchParams(qs.startsWith('?') ? qs.slice(1) : qs);
  const obj = {};
  for (var [key, value] of params.entries()) {
    if (obj.hasOwnProperty(key)) {
      if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
      obj[key].push(value);
    } else {
      if(value === "true"){
        value = true
      }else if(value === "false"){
        value = false
      }
      obj[key] = value;
    }
  }
  return obj;
}

const querys = parseQuery(location.search);

function writeHeader() {
    const src = localStorage.getItem("headerSource")
    async function getData() {
        const data = await fetch("assets/header.html", { cache: 'no-store' });
        const res = await data.text()
        localStorage.setItem("headerSource", res)
        console.log("header is added")
        if(querys.embed){
            document.querySelector("header").style.display = "none"
        }
        return res
    }
    if (src == null) {
        document.querySelector("header").innerHTML = getData()
    } else {
        document.querySelector("header").innerHTML = src
        console.log("Header is added from localStrage")
        getData()
    }

}
writeHeader();

let isLoadedDOM = false


document.addEventListener('DOMContentLoaded', () => {
    window.onload = () => {
        isLoadedDOM = true
        console.log("DOM is loaded")
    }
});


let userData = {
    isLogin:false,
}

