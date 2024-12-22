//TODO: ----------------------------------- ( Constants and Variables ) -------|
const apiURL =
  "https://script.google.com/macros/s/AKfycbzrmZ_At4CPKVY1Fjzw3GWxONpsCGfJwasEFz3DGa924ZRuwkG9RKi0hrFkXYX9p51y/exec";
let currentPage = 1;
const itemsPerPage = 5;
let notifications = [];
let activeTab = "All";

//TODO: ----------------------------------- ( Fetch Notifications ) -------|
async function fetchNotifications() {
  try {
    const response = await fetch(apiURL);
    if (!response.ok) throw new Error("Failed to fetch notifications");

    const data = await response.json();
    notifications = data
      .filter((notification) => notification.status === "Active")
      .reverse();
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
  renderTabs();

  const filteredNotifications = filterNotifications(tab);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    filteredNotifications.length
  );

  if (filteredNotifications.length === 0) {
    const emptyImageSrc = getEmptyImageSrc(tab);
    const emptyImage = document.createElement("img");
    emptyImage.className = "no_notifications_img";
    emptyImage.src = emptyImageSrc;
    emptyImage.alt = "No notifications available right now!";
    panel.appendChild(emptyImage);
  } else {
    filteredNotifications
      .slice(startIndex, endIndex)
      .forEach((notification) => {
        const isRead =
          localStorage.getItem(`read-${notification.id}`) === "true";
        const isImportant =
          localStorage.getItem(`important-${notification.id}`) === "yes";

        const notificationDiv = document.createElement("div");
        notificationDiv.classList.add("notification");
        notificationDiv.setAttribute("data-id", notification.id);
        notificationDiv.style.fontWeight = isRead ? "normal" : "bolder";
        notificationDiv.style.borderLeftColor = isRead
          ? "transparent"
          : "#4958a3";

        const title =
          notification.title.length > 30
            ? notification.title.substring(0, 30) + "..."
            : notification.title;
        const description =
          notification.description.length > 60
            ? notification.description.substring(0, 75) + "..."
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
                        }', this)">
                            <i class="${
                              isRead
                                ? "fas fa-envelope"
                                : "fa-solid fa-circle-check"
                            }"></i> ${
          isRead ? "Mark as Unread" : "Mark as Read"
        }</button>
                        <button onclick="toggleImportantStatus('${
                          notification.id
                        }', this)">
                            <i class=" ${
                              isImportant
                                ? "fa-solid fa-star-half-stroke"
                                : "fa-solid fa-star"
                            }"></i> ${
          isImportant ? "Mark as Unimportant" : "Mark as Important"
        }</button>
                        <button onclick="reportNotification()">
                            <i class="fas fa-exclamation-circle"></i> Report
                        </button>
                    </div>
                </div>
            `;

        notificationDiv.addEventListener("click", (e) => {
          if (
            !e.target.classList.contains("menu-toggle") &&
            !e.target.closest(".menu-options")
          ) {
            const target =
              notification.open_in_new_tab === "Yes" ? "_blank" : "_self";
            window.open(notification.link, target);
            markAsRead(notification.id);
          }
        });

        panel.appendChild(notificationDiv);
      });
  }

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
  updateUnreadCount();
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

function closeAllMenus() {
  const allMenus = document.querySelectorAll(".menu-options");
  allMenus.forEach((menu) => {
    menu.style.display = "none";
    menu.classList.remove("menu-open");
  });
}

//TODO: ----------------------------------- ( Notification Header ) -------|
function renderNotificationHeader() {
  const header = document.createElement("div");
  header.classList.add("notification-header");

  // Unread Count Section
  const unreadCount = notifications.filter(
    (notification) => localStorage.getItem(`read-${notification.id}`) !== "true"
  ).length;
  const importantCount = notifications.filter(
    (notification) =>
      localStorage.getItem(`important-${notification.id}`) === "yes"
  ).length;

  // Unread Count Text with Icon
  const unreadText = document.createElement("p");
  unreadText.classList.add("header-info");
  unreadText.innerHTML = `
    <i class="fas fa-envelope"></i>
    <span>Unread: ${unreadCount}</span>
  `;

  // Important Count Text with Icon
  const importantText = document.createElement("p");
  importantText.classList.add("header-info");
  importantText.innerHTML = `
    <i class="fas fa-star"></i>
    <span>Important: ${importantCount}</span>
  `;

  // * Settings Menu
  const settingsContainer = document.createElement("div");
  settingsContainer.classList.add("settings-container");

  const settingsIcon = document.createElement("button");
  settingsIcon.classList.add("menu-toggle", "settings-icon");
  settingsIcon.innerHTML = '<i class="fas fa-cog"></i>';

  const settingsMenu = document.createElement("div");
  settingsMenu.classList.add("menu-options");

  settingsMenu.innerHTML = `
    <button onclick="markAllAsRead()">
      <i class="fas fa-check-double"></i> Mark All as Read
    </button>
    <button onclick="markAllAsUnimportant()">
      <i class="fa-regular fa-star"></i> Mark All as Unimportant
    </button>
    <button onclick="reportNotification()">
      <i class="fas fa-exclamation-circle"></i> Report
    </button>
  `;

  // * Attach menu functionality
  settingsIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllMenus();
    settingsMenu.style.display =
      settingsMenu.style.display === "block" ? "none" : "block";
    settingsMenu.classList.toggle("menu-open");
  });

  let hoverTimeout;
  settingsMenu.addEventListener("mouseleave", () => {
    hoverTimeout = setTimeout(() => {
      settingsMenu.style.display = "none";
      settingsMenu.classList.remove("menu-open");
    }, 100);
  });

  settingsMenu.addEventListener("mouseenter", () => {
    clearTimeout(hoverTimeout);
  });

  settingsContainer.appendChild(settingsIcon);
  settingsContainer.appendChild(settingsMenu);

  // Append elements to header
  header.appendChild(unreadText);
  header.appendChild(importantText);
  header.appendChild(settingsContainer);

  const panel = document.getElementById("notificationPanel");
  panel.appendChild(header);
}

// Additional Functions
function markAllAsRead() {
  notifications.forEach((notification) =>
    localStorage.setItem(`read-${notification.id}`, "true")
  );
  displayNotifications(currentPage, activeTab);
  updateUnreadCount();
}

function markAllAsUnimportant() {
  notifications.forEach((notification) =>
    localStorage.setItem(`important-${notification.id}`, "no")
  );
  displayNotifications(currentPage, activeTab);
}

//TODO: ----------------------------------- ( Render Tabs ) -------|

function renderTabs() {
  const tabsContainer = document.createElement("div");
  tabsContainer.classList.add("tabs");

  const tabs = ["All", "Unread", "Important"];
  tabs.forEach((tab) => {
    const tabElement = document.createElement("div");
    tabElement.classList.add("tab");
    tabElement.dataset.tab = tab;
    tabElement.textContent = tab;
    if (tab === activeTab) tabElement.classList.add("active");

    tabElement.addEventListener("click", () => {
      activeTab = tab;
      currentPage = 1;
      displayNotifications(currentPage, activeTab);
      updateTabIndicator();
    });

    tabsContainer.appendChild(tabElement);
  });

  const tabIndicator = document.createElement("div");
  tabIndicator.classList.add("tab-indicator");
  tabsContainer.appendChild(tabIndicator);

  const panel = document.getElementById("notificationPanel");
  panel.appendChild(tabsContainer);

  updateTabIndicator();
}

function updateTabIndicator() {
  const indicator = document.querySelector(".tab-indicator");
  const activeTabElement = document.querySelector(
    `.tab[data-tab="${activeTab}"]`
  );
  indicator.style.left = `${activeTabElement.offsetLeft}px`;
  indicator.style.width = `${activeTabElement.offsetWidth}px`;
}

function getEmptyImageSrc(tab) {
  switch (tab) {
    case "Unread":
      return "https://i.ibb.co.com/gDjjL7j/No-unread-notifications.jpg";
    case "Important":
      return "https://i.ibb.co.com/0sFg5cg/No-notifications-flagged-as-important.jpg";
    default:
      return "https://i.ibb.co.com/L0F2rMj/No-notifications.jpg";
  }
}

//TODO: ----------------------------------- ( Render Pagination ) -------|

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

document.addEventListener("click", (event) => {
  document.querySelectorAll(".menu-options").forEach((menu) => {
    if (!menu.contains(event.target) && !event.target.closest(".menu-toggle")) {
      menu.style.display = "none";
      menu.classList.remove("menu-open");
    }
  });
});

document.querySelectorAll(".menu-toggle").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const menu = button.nextElementSibling;
    if (menu) {
      menu.style.display = menu.style.display === "block" ? "none" : "block";
      menu.classList.toggle("menu-open");
    }
  });
});

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
