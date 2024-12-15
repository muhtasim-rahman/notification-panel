const apiURL =
  "https://script.google.com/macros/s/AKfycbxYufeWyGtembDWJ0iRtC0L2uwdAX3A8IQ8WjDe_H3wGSO5_CNwyBW7euGSAze5JZNM/exec";

// Fetch Notifications with Error Handling
async function fetchNotifications() {
  try {
    const response = await fetch(apiURL);
    if (!response.ok) throw new Error("Failed to fetch notifications");
    const data = await response.json();
    const activeNotifications = data.filter(
      (notification) => notification.status === "Active"
    );
    displayNotifications(activeNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    alert("Unable to load notifications at this time.");
  }
}

// Display Notifications
function displayNotifications(notifications) {
  const panel = document.getElementById("notificationPanel");
  panel.innerHTML = ""; // Clear existing notifications

  if (notifications.length === 0) {
    panel.innerHTML =
      '<img class="no_notifications_img" src="https://i.ibb.co.com/YpvK8h7/no-notifications-img.jpg" alt="No notifications available right now!" />';
    return;
  }

  notifications.forEach((notification) => {
    const isRead = localStorage.getItem(`read-${notification.id}`);

    const notificationDiv = document.createElement("div");
    notificationDiv.classList.add("notification");
    if (isRead) notificationDiv.style.fontWeight = "normal";

    notificationDiv.innerHTML = `
      <img src="${notification.image}" alt="${notification.title}" class="notification-image">
      <div class="content">
        <h6>${notification.title}</h6>
        <p>${notification.description}</p>
      </div>
      <div class="menu">
        <button class="menu-toggle">⋮</button>
        <div class="menu-options">
          <button onclick="markAsRead('${notification.id}', this)">Mark as Read</button>
          <button onclick="deleteNotification('${notification.id}', this)">Delete</button>
          <button onclick="reportNotification()">Report</button>
        </div>
      </div>
    `;
    panel.appendChild(notificationDiv);
  });

  attachMenuToggleListeners();
}

// Mark Notification as Read
function markAsRead(id, button) {
  const notification = button.closest(".notification");
  notification.style.fontWeight = "normal";
  localStorage.setItem(`read-${id}`, "true");
}

// Delete Notification
function deleteNotification(id, button) {
  const notification = button.closest(".notification");
  notification.remove();
  localStorage.removeItem(`read-${id}`); // Cleanup local storage
}

// Report Notification
function reportNotification() {
  window.open("https://mdturzo.odoo.com/contact", "_blank");
}

// Attach Menu Toggle Listeners
function attachMenuToggleListeners() {
  const menuToggles = document.querySelectorAll(".menu-toggle");
  menuToggles.forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      const menu = this.nextElementSibling;
      closeAllMenus();
      menu.style.display = menu.style.display === "block" ? "none" : "block";
    });
  });
}

// Close All Menus
function closeAllMenus() {
  const allMenus = document.querySelectorAll(".menu-options");
  allMenus.forEach((menu) => (menu.style.display = "none"));
}

// Toggle Notification Panel
document.querySelector(".notification-icon").addEventListener("click", (e) => {
  e.stopPropagation();
  const panel = document.getElementById("notificationPanel");
  panel.classList.toggle("active");
});

// Close Menus and Panel on Outside Click
document.addEventListener("click", () => {
  closeAllMenus();
  document.getElementById("notificationPanel").classList.remove("active");
});

// Load Notifications on Page Load
window.addEventListener("DOMContentLoaded", fetchNotifications);
