import { fetchData } from "./api.js";

// Валидация логина
function validateUsername(username) {
    const usernameRegex = /^[A-Z][a-zA-Z0-9_]{5,19}$/;
    return usernameRegex.test(username);
}

function validatePassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;
    return passwordRegex.test(password);
}

document.addEventListener("DOMContentLoaded", async () => {
    const logoutButton = document.getElementById("logoutButton");
    const usersTable = document.getElementById("usersTable");
    const addUserForm = document.getElementById("addUserForm");
    const roleSelect = document.getElementById("roleSelect");
    const equipmentTable = document.getElementById("equipmentTable");
    const addEquipmentForm = document.getElementById("addEquipmentForm");
    const documentTable = document.getElementById("documentTable");
    const addDocumentForm = document.getElementById("addDocumentForm");

    // Логаут
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                await fetch("/logout", { method: "POST" });
                alert("Logged out successfully!");
                window.location.href = "/";
            } catch (error) {
                console.error("Failed to logout:", error);
                alert("Error during logout.");
            }
        });
    }

    // Загрузка ролей
    async function loadRoles() {
        try {
            const roles = await fetchData("/admin/roles");
            roleSelect.innerHTML = "";
            roles.forEach(role => {
                const option = document.createElement("option");
                option.value = role.id;
                option.textContent = role.name;
                roleSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Failed to load roles:", error);
            alert("Error loading roles.");
        }
    }

    // Загрузка пользователей
    async function loadUsers() {
        try {
            const users = await fetchData("/admin/users");
            const currentUser = await fetchData("/api/auth/me");
            usersTable.innerHTML = "";

            users.forEach(user => {
                const isActive = user.username === currentUser.username;
                const row = document.createElement("tr");
                row.className = isActive ? "active-user" : "";

                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.roles.map(role => role.name).join(", ")}</td>
                    <td>
                        ${isActive ? "Active User" : `
                            <select class="role-select" data-user-id="${user.id}">
                                <option value="ROLE_USER" ${user.roles.some(r => r.name === "ROLE_USER") ? "selected" : ""}>ROLE_USER</option>
                                <option value="ROLE_ADMIN" ${user.roles.some(r => r.name === "ROLE_ADMIN") ? "selected" : ""}>ROLE_ADMIN</option>
                            </select>
                            <button class="change-role-btn" data-user-id="${user.id}">Change Role</button>
                            <button class="delete-user-btn" data-user-id="${user.id}">Delete</button>
                        `}
                    </td>
                `;
                usersTable.appendChild(row);
            });
        } catch (error) {
            console.error("Failed to load users:", error);
            alert("Error loading users.");
        }
    }

    // Добавление пользователя
    addUserForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("newUsername").value.trim();
        const password = document.getElementById("newPassword").value.trim();
        const roleId = roleSelect.value;

        if (!validateUsername(username)) {
            alert("Invalid username format.");
            return;
        }

        if (!validatePassword(password)) {
            alert("Invalid password format.");
            return;
        }

        try {
            const response = await fetchData("/admin/users", "POST", {
                username,
                password,
                roleId,
            });

            alert(response.message || "User added successfully.");
            await loadUsers();
        } catch (error) {
            console.error("Failed to add user:", error);
            alert("Error adding user.");
        }
    });

    // Смена роли пользователя
    usersTable.addEventListener("click", async (e) => {
        if (e.target.classList.contains("change-role-btn")) {
            const userId = e.target.dataset.userId;
            const selectElement = e.target.parentElement.querySelector(".role-select");
            const newRole = selectElement.value;

            try {
                const response = await fetchData(`/admin/users/${userId}/role`, "PUT", { role: newRole });
                alert(response.message || "Role changed successfully.");
                await loadUsers();
            } catch (error) {
                console.error("Failed to change role:", error);
                alert("Error changing role.");
            }
        }

        if (e.target.classList.contains("delete-user-btn")) {
            const userId = e.target.dataset.userId;

            try {
                await fetchData(`/admin/users/${userId}`, "DELETE");
                alert("User deleted successfully!");
                await loadUsers();
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert("Error deleting user.");
            }
        }
    });

    // Загрузка оборудования
    async function loadEquipment() {
        try {
            const equipmentList = await fetchData("/api/equipment");
            equipmentTable.innerHTML = "";

            if (equipmentList.length === 0) {
                const row = `<tr><td colspan="6">No equipment available.</td></tr>`;
                equipmentTable.insertAdjacentHTML("beforeend", row);
                return;
            }

            equipmentList.forEach(equipment => {
                const row = `
                    <tr>
                        <td>${equipment.id}</td>
                        <td>${equipment.name}</td>
                        <td>${equipment.serialNumber}</td>
                        <td>${equipment.status}</td>
                        <td>${equipment.description || "N/A"}</td>
                        <td>
                            <button class="delete-equipment-btn" data-equipment-id="${equipment.id}">Delete</button>
                        </td>
                    </tr>
                `;
                equipmentTable.insertAdjacentHTML("beforeend", row);
            });
        } catch (error) {
            console.error("Failed to load equipment:", error);
            alert("Failed to load equipment.");
        }
    }

    // Добавление оборудования
    addEquipmentForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("equipmentName").value.trim();
        const serialNumber = document.getElementById("equipmentSerialNumber").value.trim();
        const description = document.getElementById("equipmentDescription").value.trim();

        if (!name || !serialNumber) {
            alert("Name and Serial Number are required.");
            return;
        }

        try {
            const response = await fetchData("/admin/equipment", "POST", {
                name,
                serialNumber,
                description,
            });

            alert(response.message || "Equipment added successfully.");
            await loadEquipment();
        } catch (error) {
            console.error("Failed to add equipment:", error);
            alert("Error adding equipment.");
        }
    });

    // Удаление оборудования
    equipmentTable.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-equipment-btn")) {
            const equipmentId = e.target.dataset.equipmentId;

            try {
                const response = await fetchData(`/admin/equipment/${equipmentId}`, "DELETE");
                alert(response.message || "Equipment deleted successfully.");
                await loadEquipment();
            } catch (error) {
                console.error("Failed to delete equipment:", error);
                alert("Error deleting equipment.");
            }
        }
    });


    async function loadOrders() {
        try {
            const orders = await fetchData("/api/orders");
            const ordersTable = document.getElementById("ordersTable");
            ordersTable.innerHTML = "";
    
            orders.forEach(order => {
                const row = `
                    <tr>
                        <td>${order.id}</td>
                        <td>${order.client.name}</td>
                        <td>${order.equipment.name}</td>
                        <td>
                            <select class="status-select" data-order-id="${order.id}">
                                ${["Created", "Processing", "Shipped", "Delivered", "Cancelled"]
                                    .map(status => `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`).join("")}
                            </select>
                        </td>
                        <td><button class="save-status-btn" data-order-id="${order.id}">Save</button></td>
                    </tr>`;
                ordersTable.insertAdjacentHTML("beforeend", row);
            });
        } catch (error) {
            console.error("Failed to load orders:", error);
        }
    }

    async function saveOrderStatus(orderId, newStatus) {
        try {
            await fetchData(`/api/orders/${orderId}/status`, "PUT", { status: newStatus });
            alert("Order status updated successfully!");
            await loadAllOrders();
        } catch (error) {
            console.error("Failed to update order status:", error);
            alert("Error updating order status.");
        }
    }

    // Загрузка документов
    async function loadDocuments() {
        try {
            const documents = await fetchData("/api/documents");
            documentTable.innerHTML = "";
    
            if (documents.length === 0) {
                const row = `<tr><td colspan="3">No documents available.</td></tr>`;
                documentTable.insertAdjacentHTML("beforeend", row);
                return;
            }
    
            documents.forEach(doc => {
                const row = `
                    <tr>
                        <td>${doc.id}</td>
                        <td>${doc.name}</td>
                        <td>${doc.description || "N/A"}</td>
                        <td>
                            <button class="delete-document-btn" data-document-id="${doc.id}">Delete</button>
                        </td>
                    </tr>
                `;
                documentTable.insertAdjacentHTML("beforeend", row);
            });
        } catch (error) {
            console.error("Failed to load documents:", error);
            alert("Error loading documents.");
        }
    }

    // Добавление документа
    addDocumentForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("documentName").value.trim();
        const description = document.getElementById("documentDescription").value.trim();

        if (!name) {
            alert("Name is required.");
            return;
        }

        try {
            const response = await fetchData("/api/documents", "POST", { name, description });

            if (response.error) {
                alert(`Error: ${response.error}`);
            } else {
                alert(response.message || "Document added successfully.");
                await loadDocuments(); // Обновляем таблицу документов
            }
        } catch (error) {
            console.error("Failed to add document:", error);
            alert("Error adding document.");
        }
    });

    // Удаление документа
    documentTable.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-document-btn")) {
            const documentId = e.target.dataset.documentId;

            try {
                const response = await fetchData(`/api/documents/${documentId}`, "DELETE");

                if (response.error) {
                    alert(`Error: ${response.error}`);
                } else {
                    alert(response.message || "Document deleted successfully.");
                    await loadDocuments();
                }
            } catch (error) {
                console.error("Failed to delete document:", error);
                alert("Error deleting document.");
            }
        }
    });

    document.getElementById("ordersTable").addEventListener("click", async (e) => {
        if (e.target.classList.contains("save-status-btn")) {
            const orderId = e.target.dataset.orderId;
            const selectElement = e.target.parentElement.querySelector(".status-select");
            const newStatus = selectElement.value;
    
            try {
                await fetchData(`/api/orders/${orderId}/status`, "PUT", newStatus);
                alert("Order status updated!");
            } catch (error) {
                console.error("Failed to update order status:", error);
            }
        }
    });
    
    // Загрузка всех заказов
    async function loadAllOrders() {
        try {
            const orders = await fetchData("/api/orders/all"); // Получаем данные с сервера
            const ordersTable = document.getElementById("ordersTable").querySelector("tbody");
    
            if (!ordersTable) {
                console.error("Orders table not found!");
                return;
            }
    
            ordersTable.innerHTML = ""; // Очистка таблицы перед загрузкой данных
            orders.forEach(order => {
                const row = `
                    <tr>
                        <td>${order.id}</td>
                        <td>${order.user?.username || "N/A"}</td>
                        <td>${order.equipment?.name || "N/A"}</td>
                        <td>
                            <select class="status-select" data-order-id="${order.id}">
                                ${["Создан", "На проверке", "Подтвержден", "В обработке", "Доставлен"]
                                    .map(status => `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`).join("")}
                            </select>
                        </td>
                        <td>
                            <button class="save-status-btn" data-order-id="${order.id}">Save</button>
                            <button class="delete-order-btn" data-order-id="${order.id}">Delete</button>
                        </td>
                    </tr>`;
                ordersTable.insertAdjacentHTML("beforeend", row);
            });
        } catch (error) {
            console.error("Failed to load orders:", error);
            alert("Error loading orders.");
        }
    }
    
    
    

// Изменение статуса заказа
async function changeOrderStatus(orderId) {
    const newStatus = prompt("Enter new status (Created, Processing, Shipped, Delivered, Cancelled):");
    if (newStatus) {
        try {
            const response = await fetchData(`/api/orders/${orderId}/status`, "PUT", newStatus);
            alert(`Order status updated to ${newStatus}`);
            await loadAllOrders(); // Обновить список заказов после изменения статуса
        } catch (error) {
            console.error("Failed to update order status:", error);
            alert("Error updating order status.");
        }
    }
}

// Удаление заказа
async function deleteOrder(orderId) {
    if (confirm("Are you sure you want to delete this order?")) {
        try {
            await fetchData(`/api/orders/${orderId}`, "DELETE");
            alert("Order deleted successfully!");
            await loadAllOrders();
        } catch (error) {
            console.error("Failed to delete order:", error);
            alert("Error deleting order.");
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadRoles();
        await loadUsers();
        await loadEquipment();
        await loadDocuments();
        await loadOrders(); // Загружаем заказы
    } catch (error) {
        console.error("Initialization failed:", error);
        alert("Failed to initialize admin panel.");
    }
});
document.getElementById("ordersTable").addEventListener("click", async (e) => {
    if (e.target.classList.contains("save-status-btn")) {
        const orderId = e.target.dataset.orderId;
        const selectElement = e.target.parentElement.parentElement.querySelector(".status-select");
        const newStatus = selectElement.value;

        try {
            await fetchData(`/api/orders/${orderId}/status`, "PUT", { status: newStatus });
            alert("Order status updated!");
            await loadAllOrders(); // Обновить список заказов после изменения статуса
        } catch (error) {
            console.error("Failed to update order status:", error);
            alert("Error updating order status.");
        }
    }

    if (e.target.classList.contains("delete-order-btn")) {
        const orderId = e.target.dataset.orderId;

        try {
            await fetchData(`/api/orders/${orderId}`, "DELETE");
            alert("Order deleted successfully!");
            await loadAllOrders(); // Обновить список заказов после удаления
        } catch (error) {
            console.error("Failed to delete order:", error);
            alert("Error deleting order.");
        }
    }
});

// Инициализация страницы
document.addEventListener("DOMContentLoaded", () => {
    loadAllOrders(); // Загружаем все заказы при загрузке страницы
});
    // Инициализация панели
    try {
        await loadRoles();
        await loadUsers();
        await loadEquipment();
        await loadDocuments();
    } catch (error) {
        console.error("Initialization failed:", error);
        alert("Failed to initialize admin panel.");
    }
});
