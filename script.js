// API URL
const apiURL =
  "https://script.google.com/macros/s/AKfycbz2eUH0vMqoCkEpcGXiK2rTF76RGGzq9dIvnJEn1Wanp2z2rbkFEhh4OptAoi_VjvBH/exec";

let currentPage = 1;
const itemsPerPage = 5;
let activeNotifications = [];

// Mark Notification as Read (without redirect)
function markAsRead(id) {
  localStorage.setItem(`read-${id}`, "true");

  const notificationDiv = document.querySelector(
    `.notification[data-id="${id}"]`
  );
  if (notificationDiv) {
    notificationDiv.style.fontWeight = "normal";
    notificationDiv.style.borderLeftColor = "transparent";
  }

  updateUnreadCount();
  updateHeaderUnreadCount();
}

// Toggle Read/Unread Status
function toggleReadStatus(id, button) {
  const isRead = localStorage.getItem(`read-${id}`);
  const notification = button.closest(".notification");

  if (isRead) {
    localStorage.removeItem(`read-${id}`);
    notification.style.fontWeight = "bold";
    notification.style.borderLeftColor = "#4958a3";
    button.textContent = "Mark as Read";
  } else {
    localStorage.setItem(`read-${id}`, "true");
    notification.style.fontWeight = "normal";
    notification.style.borderLeftColor = "transparent";
    button.textContent = "Mark as Unread";
  }

  updateUnreadCount();
  updateHeaderUnreadCount();
}

// Attach Menu Toggle Listeners
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

// Display Notifications with Pagination
function displayNotifications(page) {
  const panel = document.getElementById("notificationPanel");
  panel.innerHTML = ""; // Clear existing notifications

  renderNotificationHeader(); // Add header before notifications

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    activeNotifications.length
  );

  if (activeNotifications.length === 0) {
    // Select the .notification-header div and hide it
    const notificationHeader = document.querySelector(".notification-header");
    if (notificationHeader) {
      notificationHeader.style.display = "none"; // Hide the notification header
    }

    panel.innerHTML +=
      '<img class="no_notifications_img" src="https://i.ibb.co.com/YpvK8h7/no-notifications-img.jpg" alt="No notifications available right now!" />';
    return;
  } else {
    // Make sure the notification header is displayed when notifications exist
    const notificationHeader = document.querySelector(".notification-header");
    if (notificationHeader) {
      notificationHeader.style.display = ""; // Reset to default display style
    }
  }

  activeNotifications.slice(startIndex, endIndex).forEach((notification) => {
    const isReadAdmin = notification.read_unread === "Read";
    const isReadLocal = localStorage.getItem(`read-${notification.id}`);
    const isRead = isReadAdmin || isReadLocal;

    const notificationDiv = document.createElement("div");
    notificationDiv.classList.add("notification");
    notificationDiv.setAttribute("data-id", notification.id);
    notificationDiv.style.fontWeight = isRead ? "normal" : "bold";
    notificationDiv.style.borderLeftColor = isRead ? "transparent" : "#4958a3";

    const title =
      notification.title.length > 25
        ? notification.title.substring(0, 25) + "..."
        : notification.title;
    const description =
      notification.description.length > 60
        ? notification.description.substring(0, 60) + "..."
        : notification.description;

    notificationDiv.innerHTML = `
      <img src="${
        notification.image
      }" alt="${title}" class="notification-image">
      <div class="content">
        <h6>${title}</h6>
        <p>${description}</p>
      </div>
      <div class="menu">
        <button class="menu-toggle">⋮</button>
        <div class="menu-options">
          <button onclick="toggleReadStatus('${notification.id}', this)">
            ${isRead ? "Mark as Unread" : "Mark as Read"}
          </button>
          <button onclick="reportNotification()">Report Notification</button>
        </div>
      </div>
    `;

    notificationDiv.addEventListener("click", (e) => {
      if (
        !e.target.classList.contains("menu-toggle") &&
        !e.target.closest(".menu-options")
      ) {
        window.open(notification.link, "_blank");
        markAsRead(notification.id);
      }
    });

    panel.appendChild(notificationDiv);
  });

  renderPagination(); // Add pagination after notifications
  attachMenuToggleListeners();
}

// Report Notification
function reportNotification() {
  window.open("https://mdturzo.odoo.com/contact", "_blank");
}

// Fetch Notifications
async function fetchNotifications() {
  try {
    const response = await fetch(apiURL);
    if (!response.ok) throw new Error("Failed to fetch notifications");
    const data = await response.json();

    activeNotifications = data
      .filter((notification) => notification.status === "Active")
      .sort((a, b) => b.id - a.id); // Sort by ID in descending order

    updateUnreadCount();
    displayNotifications(currentPage);
  } catch (error) {
    console.error(error);
  }
}

// Update Unread Notification Count
function updateUnreadCount() {
  const unreadCount = getUnreadCount();
  const unreadBadge = document.getElementById("unreadCount");
  const markAllButton = document.getElementById("markAllReadButton");

  if (unreadCount > 0) {
    unreadBadge.textContent = unreadCount > 9 ? "9+" : unreadCount;
    unreadBadge.classList.add("active");
  } else {
    unreadBadge.classList.remove("active");
  }

  if (markAllButton) {
    if (unreadCount === 0) {
      markAllButton.disabled = true;
      markAllButton.classList.add("disabled");
    } else {
      markAllButton.disabled = false;
      markAllButton.classList.remove("disabled");
    }
  }
}

// Update Header Unread Count
function updateHeaderUnreadCount() {
  const unreadText = document.querySelector(".notification-header p");
  if (unreadText) {
    unreadText.textContent = `Unread Notifications: ${getUnreadCount()}`;
  }
}

function getUnreadCount() {
  return activeNotifications.filter(
    (notification) =>
      !localStorage.getItem(`read-${notification.id}`) &&
      notification.read_unread !== "Read"
  ).length;
}

// Render Notification Header
function renderNotificationHeader() {
  const header = document.createElement("div");
  header.classList.add("notification-header");

  const unreadText = document.createElement("p");
  const unreadCount = getUnreadCount();
  unreadText.textContent =
    unreadCount > 0
      ? `Unread Notifications: ${unreadCount}`
      : "Hurrah! No Unread Notifications";

  const markAllButton = document.createElement("button");
  markAllButton.id = "markAllReadButton";
  markAllButton.textContent = "Mark All as Read";

  if (markAllButton) {
    if (unreadCount === 0) {
      markAllButton.disabled = true;
      markAllButton.classList.add("disabled");
    } else {
      markAllButton.disabled = false;
      markAllButton.classList.remove("disabled");
    }
  }

  markAllButton.addEventListener("click", () => {
    activeNotifications.forEach((notification) =>
      localStorage.setItem(`read-${notification.id}`, "true")
    );
    displayNotifications(currentPage);
    updateUnreadCount();
    updateHeaderUnreadCount();
  });

  header.appendChild(unreadText);
  header.appendChild(markAllButton);

  const panel = document.getElementById("notificationPanel");
  panel.appendChild(header);
}

// Render Pagination
function renderPagination() {
  const pagination = document.createElement("div");
  pagination.classList.add("pagination");

  const totalPages = Math.ceil(activeNotifications.length / itemsPerPage);
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.classList.add("page-btn");
    if (i === currentPage) pageButton.classList.add("active");
    pageButton.addEventListener("click", () => {
      currentPage = i;
      displayNotifications(currentPage);
    });
    pagination.appendChild(pageButton);
  }

  const panel = document.getElementById("notificationPanel");
  panel.appendChild(pagination);
}

// Close All Menus
function closeAllMenus() {
  const allMenus = document.querySelectorAll(".menu-options");
  allMenus.forEach((menu) => {
    menu.style.display = "none";
    menu.classList.remove("menu-open");

    menu.addEventListener("click", () => {
      menu.style.display = "none";
      menu.classList.remove("menu-open");
    });
  });
}

// Initialize
document.querySelector(".notification-icon").addEventListener("click", (e) => {
  e.stopPropagation();
  const panel = document.getElementById("notificationPanel");
  panel.classList.toggle("active");
});

document.addEventListener("click", () => {
  closeAllMenus();
  document.getElementById("notificationPanel").classList.remove("active");
});

document
  .getElementById("notificationPanel")
  .addEventListener("click", (e) => e.stopPropagation());

window.addEventListener("DOMContentLoaded", fetchNotifications);

//! Clear the local storage
document
  .getElementById("clearStorageBtn")
  .addEventListener("click", function () {
    localStorage.clear();
    showPopup();
    setTimeout(hidePopup, 2000);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  });

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

//* Load Notifications on Page Load
window.addEventListener("DOMContentLoaded", fetchNotifications);
