// API URL: Endpoint to fetch notifications
const apiURL =
  "https://script.google.com/macros/s/AKfycbz2eUH0vMqoCkEpcGXiK2rTF76RGGzq9dIvnJEn1Wanp2z2rbkFEhh4OptAoi_VjvBH/exec";

let currentPage = 1; // Tracks the current page in pagination
const itemsPerPage = 6; // Number of notifications to display per page
let activeNotifications = []; // Stores the list of active notifications

// -----------------------------------------------------------------------------
// Mark Notification as Read (without redirect)
function markAsRead(id) {
  // Save read status in local storage
  localStorage.setItem(`read-${id}`, "true");

  // Update UI to reflect read status
  const notificationDiv = document.querySelector(
    `.notification[data-id="${id}"]`
  );
  if (notificationDiv) {
    notificationDiv.style.fontWeight = "normal";
    notificationDiv.style.borderLeftColor = "transparent";
  }

  // Update unread count in the UI
  updateUnreadCount();
  updateHeaderUnreadCount();
}

// -----------------------------------------------------------------------------
// Toggle Read/Unread Status
function toggleReadStatus(id, button) {
  const isRead = localStorage.getItem(`read-${id}`);
  const notification = button.closest(".notification");

  if (isRead) {
    // Mark as unread
    localStorage.removeItem(`read-${id}`);
    notification.style.fontWeight = "bold";
    notification.style.borderLeftColor = "#4958a3";
    button.textContent = "Mark as Read";
  } else {
    // Mark as read
    localStorage.setItem(`read-${id}`, "true");
    notification.style.fontWeight = "normal";
    notification.style.borderLeftColor = "transparent";
    button.textContent = "Mark as Unread";
  }

  // Update counts in the UI
  updateUnreadCount();
  updateHeaderUnreadCount();
}

// -----------------------------------------------------------------------------
// Attach Listeners for Menu Toggle (Three-dot menu)
function attachMenuToggleListeners() {
  const menuToggles = document.querySelectorAll(".menu-toggle");
  menuToggles.forEach((toggle) => {
    const menu = toggle.nextElementSibling;

    // Toggle menu visibility
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAllMenus();
      menu.style.display = menu.style.display === "block" ? "none" : "block";
      menu.classList.toggle("menu-open");
    });

    // Hide menu when mouse leaves
    let hoverTimeout;
    menu.addEventListener("mouseleave", () => {
      hoverTimeout = setTimeout(() => {
        menu.style.display = "none";
        menu.classList.remove("menu-open");
      }, 100);
    });

    // Prevent hiding when mouse enters again
    menu.addEventListener("mouseenter", () => {
      clearTimeout(hoverTimeout);
    });
  });
}

// -----------------------------------------------------------------------------
// Display Notifications with Pagination
function displayNotifications(page) {
  const panel = document.getElementById("notificationPanel");
  panel.innerHTML = ""; // Clear existing content

  renderNotificationHeader(); // Add the header

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    activeNotifications.length
  );

  // Handle case where no notifications are available
  if (activeNotifications.length === 0) {
    const notificationHeader = document.querySelector(".notification-header");
    if (notificationHeader) {
      notificationHeader.style.display = "none";
    }

    panel.innerHTML +=
      '<img class="no_notifications_img" src="https://i.ibb.co.com/YpvK8h7/no-notifications-img.jpg" alt="No notifications available right now!" />';
    return;
  }

  // Ensure the notification header is visible
  const notificationHeader = document.querySelector(".notification-header");
  if (notificationHeader) {
    notificationHeader.style.display = "";
  }

  // Render each notification
  activeNotifications.slice(startIndex, endIndex).forEach((notification) => {
    const isReadAdmin = notification.read_unread === "Read";
    const isReadLocal = localStorage.getItem(`read-${notification.id}`);
    const isRead = isReadAdmin || isReadLocal;

    const notificationDiv = document.createElement("div");
    notificationDiv.classList.add("notification");
    notificationDiv.setAttribute("data-id", notification.id);
    notificationDiv.style.fontWeight = isRead ? "normal" : "bold";
    notificationDiv.style.borderLeftColor = isRead ? "transparent" : "#4958a3";

    // Prepare content with truncated title and description
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

    // Add click listener for opening the link
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

  renderPagination(); // Add pagination controls
  attachMenuToggleListeners(); // Enable menu toggling
}

// -----------------------------------------------------------------------------
// Report Notification (placeholder function for reporting logic)
function reportNotification() {
  window.open("https://mdturzo.odoo.com/contact", "_blank");
}

// -----------------------------------------------------------------------------
// Fetch Notifications from API
async function fetchNotifications() {
  try {
    const response = await fetch(apiURL);
    if (!response.ok) throw new Error("Failed to fetch notifications");

    const data = await response.json();

    // Filter active notifications and sort by ID (descending)
    activeNotifications = data
      .filter((notification) => notification.status === "Active")
      .sort((a, b) => b.id - a.id);

    updateUnreadCount(); // Update unread counts
    displayNotifications(currentPage); // Display first page
  } catch (error) {
    console.error(error);
  }
}

// -----------------------------------------------------------------------------
// Additional Helper Functions for UI

// Update the unread count badge and button states
function updateUnreadCount() {
  const unreadCount = getUnreadCount(); // Get the number of unread notifications
  const unreadBadge = document.getElementById("unreadCount");
  const markAllButton = document.getElementById("markAllReadButton");

  // Update unread badge
  if (unreadCount > 0) {
    unreadBadge.textContent = unreadCount > 9 ? "9+" : unreadCount;
    unreadBadge.classList.add("active"); // Show the badge
  } else {
    unreadBadge.classList.remove("active"); // Hide the badge
  }

  // Update "Mark All as Read" button state
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

// Update the header with unread notification count
function updateHeaderUnreadCount() {
  const unreadText = document.querySelector(".notification-header p");
  if (unreadText) {
    unreadText.textContent = `Unread Notifications: ${getUnreadCount()}`;
  }
}

// Get the count of unread notifications
function getUnreadCount() {
  return activeNotifications.filter(
    (notification) =>
      !localStorage.getItem(`read-${notification.id}`) &&
      notification.read_unread !== "Read"
  ).length;
}

// Render the notification header
function renderNotificationHeader() {
  const header = document.createElement("div");
  header.classList.add("notification-header");

  // Unread notification count text
  const unreadText = document.createElement("p");
  const unreadCount = getUnreadCount();
  unreadText.textContent =
    unreadCount > 0
      ? `Unread Notifications: ${unreadCount}`
      : "Hurrah! No Unread Notifications";

  // "Mark All as Read" button
  const markAllButton = document.createElement("button");
  markAllButton.id = "markAllReadButton";
  markAllButton.textContent = "Mark All as Read";

  // Enable/Disable "Mark All as Read" button based on unread count
  if (markAllButton) {
    if (unreadCount === 0) {
      markAllButton.disabled = true;
      markAllButton.classList.add("disabled");
    } else {
      markAllButton.disabled = false;
      markAllButton.classList.remove("disabled");
    }
  }

  // Mark all notifications as read on button click
  markAllButton.addEventListener("click", () => {
    activeNotifications.forEach((notification) =>
      localStorage.setItem(`read-${notification.id}`, "true")
    );
    displayNotifications(currentPage);
    updateUnreadCount();
    updateHeaderUnreadCount();
  });

  // Append text and button to the header
  header.appendChild(unreadText);
  header.appendChild(markAllButton);

  const panel = document.getElementById("notificationPanel");
  panel.appendChild(header);
}

// Render pagination controls
function renderPagination() {
  const pagination = document.createElement("div");
  pagination.classList.add("pagination");

  const totalPages = Math.ceil(activeNotifications.length / itemsPerPage);
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.classList.add("page-btn");
    if (i === currentPage) pageButton.classList.add("active");

    // Update the displayed page on button click
    pageButton.addEventListener("click", () => {
      currentPage = i;
      displayNotifications(currentPage);
    });

    pagination.appendChild(pageButton);
  }

  const panel = document.getElementById("notificationPanel");
  panel.appendChild(pagination);
}

// Close all open menus
function closeAllMenus() {
  const allMenus = document.querySelectorAll(".menu-options");
  allMenus.forEach((menu) => {
    menu.style.display = "none"; // Hide the menu
    menu.classList.remove("menu-open"); // Remove open class

    // Hide menu on click
    menu.addEventListener("click", () => {
      menu.style.display = "none";
      menu.classList.remove("menu-open");
    });
  });
}

// -----------------------------------------------------------------------------
// Initialization and Event Listeners
// Toggle notification panel visibility
document.querySelector(".notification-icon").addEventListener("click", (e) => {
  e.stopPropagation();
  const panel = document.getElementById("notificationPanel");
  panel.classList.toggle("active");
});

// Close menus and panels on outside click
document.addEventListener("click", () => {
  closeAllMenus();
  document.getElementById("notificationPanel").classList.remove("active");
});

// Prevent event propagation for panel clicks
document.getElementById("notificationPanel").addEventListener("click", (e) => {
  e.stopPropagation();
});

// Fetch notifications when the DOM is loaded
window.addEventListener("DOMContentLoaded", fetchNotifications);

// -----------------------------------------------------------------------------
// Clear Local Storage
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
