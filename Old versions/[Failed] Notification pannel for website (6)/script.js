// API URL: Endpoint to fetch notifications from Google Sheets
const apiURL =
  "https://script.google.com/macros/s/AKfycbz2eUH0vMqoCkEpcGXiK2rTF76RGGzq9dIvnJEn1Wanp2z2rbkFEhh4OptAoi_VjvBH/exec";

let currentPage = 1; // Tracks the current page in pagination
const itemsPerPage = 6; // Number of notifications to display per page
let activeNotifications = []; // Stores the list of active notifications

// -----------------------------------------------------------------------------
// Mark Notification as Read (without redirect)
function markAsRead(id) {
  // Update read status in local storage
  localStorage.setItem(`read-${id}`, "true");

  // Find the notification in the active list
  const notification = activeNotifications.find((n) => n.id === id);
  if (!notification) return; // Notification not found, skip

  // Update notification data based on user preference
  notification.read_unread =
    localStorage.getItem(`read-${id}`) === "true" ? "Read" : "Unread";

  // Update UI to reflect read status
  const notificationDiv = document.querySelector(
    `.notification[data-id="${id}"]`
  );
  if (notificationDiv) {
    notificationDiv.style.fontWeight =
      notification.read_unread === "Read" ? "normal" : "bold";
    notificationDiv.style.borderLeftColor =
      notification.read_unread === "Read" ? "transparent" : "#4958a3";
    const toggleButton = notificationDiv.querySelector(".menu-options button");
    if (toggleButton)
      toggleButton.textContent =
        notification.read_unread === "Read" ? "Mark as Unread" : "Mark as Read";
  }

  // Update unread count in the UI
  updateUnreadCount();
  updateHeaderUnreadCount();
}

// -----------------------------------------------------------------------------
// Toggle Read/Unread Status
function toggleReadStatus(id, button) {
  // Find the notification in the active list
  const notification = activeNotifications.find((notif) => notif.id === id);
  if (!notification) return;

  // Toggle read/unread status based on user preference
  notification.read_unread =
    localStorage.getItem(`read-${id}`) === "true" ? "Unread" : "Read";
  localStorage.setItem(`read-${id}`, notification.read_unread);

  // Update button text
  button.textContent =
    notification.read_unread === "Read" ? "Mark as Unread" : "Mark as Read";

  // Update the notification's style
  const notificationDiv = document.querySelector(
    `.notification[data-id="${id}"]`
  );
  if (notificationDiv) {
    notificationDiv.style.fontWeight =
      notification.read_unread === "Read" ? "normal" : "bold";
    notificationDiv.style.borderLeftColor =
      notification.read_unread === "Read" ? "transparent" : "#4958a3";
  }

  // Update the unread count
  updateUnreadCount();
  updateHeaderUnreadCount();
}

// -----------------------------------------------------------------------------
// Attach Listeners for Menu Toggle (Three-dot menu)
function attachMenuToggleListeners() {
  const menuToggles = document.querySelectorAll(".menu-toggle");

  menuToggles.forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent propagation to document click
      const menu = toggle.nextElementSibling;

      // Toggle menu visibility
      if (menu) {
        const isMenuOpen = menu.style.display === "block";

        // Close all menus before toggling
        closeAllMenus();

        if (!isMenuOpen) {
          menu.style.display = "block";
          menu.style.opacity = "1";
          menu.style.transform = "translateY(0)";
        }
      }
    });
  });

  // Close menus when clicking anywhere outside
  document.addEventListener("click", () => {
    const menus = document.querySelectorAll(".menu-options");
    menus.forEach((menu) => {
      menu.style.display = "none";
      menu.style.opacity = "0";
      menu.style.transform = "translateY(-10px)";
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

    panel.innerHTML += `
      <img class="no_notifications_img" src="https://i.ibb.co/YpvK8h7/no-notifications-img.jpg" alt="No notifications available right now!" />
      <p>No notifications available right now!</p>
    `;
    return;
  }

  // Ensure the notification header is visible
  const notificationHeader = document.querySelector(".notification-header");
  if (notificationHeader) {
    notificationHeader.style.display = "";
  }

  // Render each notification
  activeNotifications.slice(startIndex, endIndex).forEach((notification) => {
    const isDeleted = notification.deleted === "Deleted";
    const isRead = localStorage.getItem(`read-${notification.id}`) === "true";

    if (isDeleted) return; // Skip deleted notifications

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
      <img src="<span class="math-inline">\{notification\.image\}" alt\="</span>{title}" class="notification-image">
      <div class="content">
        <h6><span class="math-inline">\{title\}</h6\>
<p\></span>{description}</p>
      </div>
      <div class="menu">
        <button class="menu-toggle">⋮</button>
        <div class="menu-options">
          <button onclick="toggleReadStatus('${notification.id}', this)">
            <span class="math-inline">\{isRead ? "Mark as Unread" \: "Mark as Read"\}
</button\>
<button onclick\="deleteNotification\('</span>{notification.id}')">Hide from Notification Panel</button>
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
// Delete Notification
function deleteNotification(id) {
  // Find the notification in the active list
  const notification = activeNotifications.find((notif) => notif.id === id);
  if (!notification) return; // Notification not found, skip

  // Mark the notification as deleted
  notification.deleted = "Deleted";
  localStorage.setItem(`deleted-${id}`, "true");

  // Remove the notification from the UI
  const notificationDiv = document.querySelector(
    `.notification[data-id="${id}"]`
  );
  if (notificationDiv) {
    notificationDiv.remove();
  }

  // Update pagination if necessary
  if (activeNotifications.length === itemsPerPage * currentPage) {
    displayNotifications(currentPage);
  }

  // Update unread count
  updateUnreadCount();
  updateHeaderUnreadCount();
}

// -----------------------------------------------------------------------------
// Report Notification
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
