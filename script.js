//TODO: ----------------------------------- ( Constants and Variables ) -------|
const apiURL =
  "https://script.google.com/macros/s/AKfycbz2eUH0vMqoCkEpcGXiK2rTF76RGGzq9dIvnJEn1Wanp2z2rbkFEhh4OptAoi_VjvBH/exec";
let currentPage = 1;
const itemsPerPage = 6;
let notifications = [];
let activeTab = "All";

//TODO: ----------------------------------- ( Fetch Notifications ) -------|
async function fetchNotifications() {
  try {
    const response = await fetch(apiURL);
    if (!response.ok) throw new Error("Failed to fetch notifications");

    const data = await response.json();
    notifications = data.filter(
      (notification) => notification.status === "Active"
    );
    localStorage.setItem("notifications", JSON.stringify(notifications));

    updateUnreadCount();
    displayNotifications(currentPage, activeTab);
  } catch (error) {
    console.error(error);
  }
}

//TODO: ----------------------------------- ( Display Notifications ) -------|
function displayNotifications(page, tab) {
  const panel = document.getElementById("notificationPanel");
  panel.innerHTML = "";

  renderNotificationHeader();

  const filteredNotifications = filterNotifications(tab);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    filteredNotifications.length
  );

  if (filteredNotifications.length === 0) {
    panel.innerHTML += `<img class="no_notifications_img" src="path/to/empty-image-${tab.toLowerCase()}.jpg" alt="No notifications available right now!" />`;
    return;
  }

  filteredNotifications.slice(startIndex, endIndex).forEach((notification) => {
    const isRead = localStorage.getItem(`read-${notification.id}`) === "true";
    const isImportant =
      localStorage.getItem(`important-${notification.id}`) === "yes";

    const notificationDiv = document.createElement("div");
    notificationDiv.classList.add("notification");
    notificationDiv.setAttribute("data-id", notification.id);
    notificationDiv.style.fontWeight = isRead ? "normal" : "bold";
    notificationDiv.style.borderLeftColor = isRead ? "transparent" : "#4958a3";

    const title =
      notification.title.length > 30
        ? notification.title.substring(0, 30) + "..."
        : notification.title;
    const description =
      notification.description.length > 60
        ? notification.description.substring(0, 60) + "..."
        : notification.description;

    notificationDiv.innerHTML = `
            <div class="notification-image-container">
                <img src="${
                  notification.image
                }" alt="${title}" class="notification-image">
                ${
                  isImportant
                    ? '<i class="fas fa-star important-icon"></i>'
                    : ""
                }
            </div>
            <div class="content">
                <h6>${title}</h6>
                <p>${description}</p>
            </div>
            <div class="menu">
                <button class="menu-toggle">⋮</button>
                <div class="menu-options">
                    <button onclick="toggleReadStatus('${
                      notification.id
                    }', this)">${
      isRead ? "Mark as Unread" : "Mark as Read"
    }</button>
                    <button onclick="toggleImportantStatus('${
                      notification.id
                    }', this)">${
      isImportant ? "Mark as Unimportant" : "Mark as Important"
    }</button>
                    <button onclick="deleteNotification('${
                      notification.id
                    }')">Delete</button>
                    <button onclick="reportNotification()">Report</button>
                </div>
            </div>
        `;

    notificationDiv.addEventListener("click", (e) => {
      if (
        !e.target.classList.contains("menu-toggle") &&
        !e.target.closest(".menu-options")
      ) {
        window.open(notification.link, "_blank"); // This will open in a new tab, change as needed
        markAsRead(notification.id);
      }
    });

    panel.appendChild(notificationDiv);
  });

  renderPagination(filteredNotifications.length);
  attachMenuToggleListeners();
}

//TODO: ----------------------------------- ( Filter Notifications ) -------|
function filterNotifications(tab) {
  switch (tab) {
    case "Unread":
      return notifications.filter(
        (notification) =>
          localStorage.getItem(`read-${notification.id}`) !== "true"
      );
    case "Important":
      return notifications.filter(
        (notification) =>
          localStorage.getItem(`important-${notification.id}`) === "yes"
      );
    default:
      return notifications;
  }
}

//TODO: ----------------------------------- ( Notification Actions ) -------|
function markAsRead(id) {
  localStorage.setItem(`read-${id}`, "true");
  updateUnreadCount();
  displayNotifications(currentPage, activeTab);
}

function toggleReadStatus(id, button) {
  const isRead = localStorage.getItem(`read-${id}`) === "true";
  localStorage.setItem(`read-${id}`, isRead ? "false" : "true");
  button.textContent = isRead ? "Mark as Read" : "Mark as Unread";
  displayNotifications(currentPage, activeTab);
}

function toggleImportantStatus(id, button) {
  const isImportant = localStorage.getItem(`important-${id}`) === "yes";
  localStorage.setItem(`important-${id}`, isImportant ? "no" : "yes");
  button.textContent = isImportant
    ? "Mark as Important"
    : "Mark as Unimportant";
  displayNotifications(currentPage, activeTab);
}

function deleteNotification(id) {
  localStorage.setItem(`status-${id}`, "Deleted");
  notifications = notifications.filter(
    (notification) => notification.id !== id
  );
  localStorage.setItem("notifications", JSON.stringify(notifications));
  displayNotifications(currentPage, activeTab);
}

function reportNotification() {
  window.open("https://mdturzo.odoo.com/contact", "_blank");
}

//TODO: ----------------------------------- ( Menu and UI Updates ) -------|
function attachMenuToggleListeners() {
  const menuToggles = document.querySelectorAll(".menu-toggle");
  menuToggles.forEach((toggle) => {
    const menu = toggle.nextElementSibling;

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAllMenus();
      menu.style.display = menu.style.display === "block" ? "none" : "block";
      menu.classList.toggle("menu-open");
    });

    let hoverTimeout;
    menu.addEventListener("mouseleave", () => {
      hoverTimeout = setTimeout(() => {
        menu.style.display = "none";
        menu.classList.remove("menu-open");
      }, 100);
    });

    menu.addEventListener("mouseenter", () => {
      clearTimeout(hoverTimeout);
    });
  });
}

function updateUnreadCount() {
  const unreadCount = notifications.filter(
    (notification) => localStorage.getItem(`read-${notification.id}`) !== "true"
  ).length;
  const unreadBadge = document.getElementById("unreadCount");
  unreadBadge.textContent = unreadCount > 9 ? "9+" : unreadCount;
  unreadBadge.classList.toggle("active", unreadCount > 0);
}

//TODO: ----------------------------------- ( Render Components ) -------|
function renderNotificationHeader() {
  const header = document.createElement("div");
  header.classList.add("notification-header");

  const unreadText = document.createElement("p");
  const unreadCount = notifications.filter(
    (notification) => localStorage.getItem(`read-${notification.id}`) !== "true"
  ).length;
  unreadText.textContent = `Unread Notifications: ${unreadCount}`;

  const markAllButton = document.createElement("button");
  markAllButton.id = "markAllReadButton";
  markAllButton.textContent = "Mark All as Read";
  markAllButton.disabled = unreadCount === 0;
  markAllButton.classList.toggle("disabled", unreadCount === 0);

  markAllButton.addEventListener("click", () => {
    notifications.forEach((notification) =>
      localStorage.setItem(`read-${notification.id}`, "true")
    );
    displayNotifications(currentPage, activeTab);
    updateUnreadCount();
  });

  header.appendChild(unreadText);
  header.appendChild(markAllButton);

  const panel = document.getElementById("notificationPanel");
  panel.appendChild(header);
}

function renderPagination(totalItems) {
  const pagination = document.createElement("div");
  pagination.classList.add("pagination");

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.classList.add("page-btn");
    if (i === currentPage) pageButton.classList.add("active");

    pageButton.addEventListener("click", () => {
      currentPage = i;
      displayNotifications(currentPage, activeTab);
    });

    pagination.appendChild(pageButton);
  }

  const panel = document.getElementById("notificationPanel");
  panel.appendChild(pagination);
}

function closeAllMenus() {
  const allMenus = document.querySelectorAll(".menu-options");
  allMenus.forEach((menu) => {
    menu.style.display = "none";
    menu.classList.remove("menu-open");
  });
}

//TODO: ----------------------------------- ( Event Listeners ) -------|
document.querySelector(".notification-icon").addEventListener("click", (e) => {
  e.stopPropagation();
  const panel = document.getElementById("notificationPanel");
  panel.classList.toggle("active");
});

document.addEventListener("click", () => {
  closeAllMenus();
  document.getElementById("notificationPanel").classList.remove("active");
});

document.getElementById("notificationPanel").addEventListener("click", (e) => {
  e.stopPropagation();
});

window.addEventListener("DOMContentLoaded", fetchNotifications);

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
