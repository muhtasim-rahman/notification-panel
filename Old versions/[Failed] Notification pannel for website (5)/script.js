// API URL
const apiURL =
  "https://script.google.com/macros/s/AKfycbz2eUH0vMqoCkEpcGXiK2rTF76RGGzq9dIvnJEn1Wanp2z2rbkFEhh4OptAoi_VjvBH/exec";

let currentPage = 1;
const itemsPerPage = 5;
let activeNotifications = [];

// TODO ---------------------------------------------------------------------- // Notification Header

// Create and Render Notification Header
function renderNotificationHeader() {
  const panel = document.getElementById("notificationPanel");

  // Ensure a single instance of the header exists
  let header = panel.querySelector(".notification-header");
  if (!header) {
    header = document.createElement("div");
    header.classList.add("notification-header");

    // Create elements for the header
    const unreadText = document.createElement("p");
    unreadText.id = "unreadText"; // To dynamically update unread count
    header.appendChild(unreadText);

    const markAllButton = document.createElement("button");
    markAllButton.id = "markAllReadButton";
    markAllButton.textContent = "Mark All as Read";
    markAllButton.disabled = true; // Initially disabled
    markAllButton.addEventListener("click", markAllAsRead);
    header.appendChild(markAllButton);

    // Append header to the panel
    panel.prepend(header);
  }

  // Update the content of the header
  updateHeader();
}

// Update Header Content Dynamically
function updateHeader() {
  const unreadText = document.getElementById("unreadText");
  const markAllButton = document.getElementById("markAllReadButton");
  const unreadCount = getUnreadCount();

  // Update the header text
  if (unreadText) {
    unreadText.textContent =
      unreadCount > 0
        ? `Unread Notifications: ${unreadCount}`
        : "Hurrah! No Unread Notifications";
  }

  // Enable or disable the "Mark All as Read" button
  if (markAllButton) {
    markAllButton.disabled = unreadCount === 0;
  }
}

// Mark All Notifications as Read
function markAllAsRead() {
  activeNotifications.forEach((notification) =>
    localStorage.setItem(`read-${notification.id}`, "true")
  );
  displayNotifications(currentPage); // Re-render notifications
  updateUnreadCount(); // Update badge
  updateHeader(); // Update header text and button state
}

// Get Unread Notifications Count
function getUnreadCount() {
  return activeNotifications.filter(
    (notification) =>
      !localStorage.getItem(`read-${notification.id}`) &&
      notification.read_unread !== "Read"
  ).length;
}

// TODO ---------------------------------------------------------------------- // Notification Tabs

//* Create Tabs
function createTabs() {
  const panel = document.getElementById("notificationPanel");

  // Check if the tab container already exists and avoid duplication
  if (panel.querySelector(".tab-container")) return;

  const tabContainer = document.createElement("div");
  tabContainer.classList.add("tab-container");

  const tabs = ["All", "Unread", "Important"];
  const tabBar = document.createElement("div");
  tabBar.classList.add("tab-bar");

  tabs.forEach((tab, index) => {
    const tabButton = document.createElement("button");
    tabButton.classList.add("tab-button");
    if (index === 0) tabButton.classList.add("active");
    tabButton.textContent = tab;

    tabButton.addEventListener("click", () => {
      const allTabs = document.querySelectorAll(".tab-button");
      allTabs.forEach((btn) => btn.classList.remove("active"));
      tabButton.classList.add("active");

      // Move the tab bar to the active tab
      const tabWidth = tabButton.offsetWidth;
      const tabLeft = tabButton.offsetLeft;
      tabBar.style.width = `${tabWidth}px`;
      tabBar.style.transform = `translateX(${tabLeft}px)`;

      // Filter notifications based on the tab
      filterNotifications(tab);
    });

    tabContainer.appendChild(tabButton);
  });

  // Add the tab bar to the tab container
  tabContainer.appendChild(tabBar);
  panel.appendChild(tabContainer); // Append tabs right after the header

  // Initialize the tab bar position
  const firstTab = tabContainer.querySelector(".tab-button.active");
  if (firstTab) {
    tabBar.style.width = `${firstTab.offsetWidth}px`;
    tabBar.style.transform = `translateX(${firstTab.offsetLeft}px)`;
  }
}

//* Filter Notifications Based on Tab
function filterNotifications(tab) {
  const panel = document.getElementById("notificationPanel");
  const paginationContainer = document.querySelector(".pagination-container");
  const noNotificationImages = {
    All: "https://i.ibb.co.com/L0F2rMj/No-notifications.jpg",
    Unread: "https://i.ibb.co.com/gDjjL7j/No-unread-notifications.jpg",
    Important:
      "https://i.ibb.co.com/0sFg5cg/No-notifications-flagged-as-important.jpg",
  };

  // Remove only notifications, not the header or tabs
  const notifications = panel.querySelectorAll(
    ".notification, .no-notifications-img"
  );
  notifications.forEach((element) => element.remove());

  if (tab === "All") {
    if (activeNotifications.length > 0) {
      displayNotifications(currentPage);
    } else {
      const img = createNoNotificationsImage(noNotificationImages.All);
      panel.insertBefore(img, paginationContainer);
    }
  } else if (tab === "Unread") {
    const unreadNotifications = activeNotifications.filter(
      (notification) => !localStorage.getItem(`read-${notification.id}`)
    );
    if (unreadNotifications.length > 0) {
      activeNotifications = unreadNotifications;
      displayNotifications(currentPage);
    } else {
      const img = createNoNotificationsImage(noNotificationImages.Unread);
      panel.insertBefore(img, paginationContainer);
    }
  } else if (tab === "Important") {
    const importantNotifications = activeNotifications.filter((notification) =>
      localStorage.getItem(`important-${notification.id}`)
    );
    if (importantNotifications.length > 0) {
      activeNotifications = importantNotifications;
      displayNotifications(currentPage);
    } else {
      const img = createNoNotificationsImage(noNotificationImages.Important);
      panel.insertBefore(img, paginationContainer);
    }
  }
}

//* Helper Function to Create No Notifications Image
function createNoNotificationsImage(src) {
  const img = document.createElement("img");
  img.classList.add("no-notifications-img");
  img.src = src;
  img.alt = "No notifications available right now!";
  return img;
}

//* Update Header Unread Count
function updateHeaderUnreadCount() {
  const unreadText = document.querySelector(".notification-header p");
  if (unreadText) {
    unreadText.textContent = `Unread Notifications: ${getUnreadCount()}`;
  }
}

//* Get Unread Notification Count
function getUnreadCount() {
  return activeNotifications.filter(
    (notification) =>
      !localStorage.getItem(`read-${notification.id}`) &&
      notification.read_unread !== "Read"
  ).length;
}

// TODO ---------------------------------------------------------------------- // Display Notifications

//* Display Notifications with Pagination
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

    // panel.innerHTML +=
    //   '<img class="no_notifications_img" src="https://i.ibb.co.com/YpvK8h7/no-notifications-img.jpg" alt="No notifications available right now!" />';
    // return;
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

    const starIcon = document.createElement("i");
    starIcon.className = "fas fa-star notification-star";
    starIcon.style.color = notification.important ? "gold" : "lightgray";
    starIcon.addEventListener("click", () =>
      toggleImportantStatus(notification.id, starIcon)
    );

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
          <button onclick="toggleImportantStatus('${
            notification.id
          }', this)">Mark as Important/Unimportant</button>
          <button onclick="deleteNotification('${
            notification.id
          }')">Delete</button>
          <button onclick="reportNotification()">Report Notification</button>
        </div>
      </div>
    `;

    notificationDiv.appendChild(starIcon);

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

//* Fetch Notifications
async function fetchNotifications() {
  try {
    const response = await fetch(apiURL);
    if (!response.ok) throw new Error("Failed to fetch notifications");
    const data = await response.json();

    activeNotifications = data
      .filter((notification) => notification.status === "Active")
      .sort((a, b) => b.id - a.id); // Sort by ID in descending order

    activeNotifications.forEach((notification) => {
      if (notification.read_unread === "Read") {
        localStorage.setItem(`read-${notification.id}`, "true");
      }
      if (notification.important) {
        localStorage.setItem(`important-${notification.id}`, "true");
      }
    });

    updateUnreadCount();
    displayNotifications(currentPage);
    createTabs();
  } catch (error) {
    console.error(error);
  }
}

// TODO ---------------------------------------------------------------------- // Three dot menu

//* Attach Menu Toggle Listeners
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

//* Mark Notification as Read (without redirect)
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

//* Toggle Read/Unread Status
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

//* Update Unread Notification Count
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

//* Toggle Important Status
function toggleImportantStatus(id, starIcon) {
  const isImportant = localStorage.getItem(`important-${id}`);
  if (isImportant) {
    localStorage.removeItem(`important-${id}`);
    starIcon.style.color = "lightgray";
  } else {
    localStorage.setItem(`important-${id}`, "true");
    starIcon.style.color = "gold";
  }
  displayNotifications(currentPage);
}

//* Report Notification
function reportNotification() {
  window.open("https://mdturzo.odoo.com/contact", "_blank");
}

//* Close All Menus
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

// TODO ---------------------------------------------------------------------- // Pagination

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

// TODO ---------------------------------------------------------------------- // Initialize

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

// TODO ---------------------------------------------------------------------- //! Clear the local storage
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
