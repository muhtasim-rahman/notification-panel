//TODO: ----------------------------------- ( Clear Local Storage ) -------|

document.getElementById("clearStorageBtn").addEventListener("click", () => {
  localStorage.clear();
  showPopup();
  setTimeout(hidePopup, 2000);
  setTimeout(() => window.location.reload(), 1000);
});

// Show and hide popup messages

function showPopup() {
  const popup = document.getElementById("confirmationPopup");
  popup.style.display = "block";
  popup.style.opacity = "1";
}

function hidePopup() {
  const popup = document.getElementById("confirmationPopup");
  popup.style.opacity = "0";
  setTimeout(() => {
    popup.style.display = "none";
  }, 500);
}
