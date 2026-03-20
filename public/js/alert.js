  //アラート系
  document.querySelector("header").outerHTML += `<div class="alert alert-danger alertDisplay hide" role="alert"></div>`
  let alertMessage = ""
  const alertEl = document.querySelector(".alertDisplay")
  setInterval(()=>{
    if(alertMessage == ""){
        alertEl.classList.add("hide")
    }else{
        alertEl.classList.remove("hide")
        alertEl.textContent = alertMessage
    }
  },1000/24)