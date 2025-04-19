import { fetchData } from "./api.js";

// --- Валидация (остается без изменений) ---
function validateUsername(username) {
    const usernameRegex = /^[A-Z][a-zA-Z0-9_]{5,19}$/;
    return usernameRegex.test(username);
}

function validatePassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;
    return passwordRegex.test(password);
}

// --- Функции загрузки данных ---

// Загрузка ролей
async function loadRoles() {
    const roleSelect = document.getElementById("roleSelect");
    if (!roleSelect) return; // Добавлена проверка на случай отсутствия элемента
    try {
        const roles = await fetchData("/admin/roles");
        roleSelect.innerHTML = ""; // Очищаем перед заполнением
        roles.forEach(role => {
            const option = document.createElement("option");
            option.value = role.id;
            option.textContent = role.name;
            roleSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Failed to load roles:", error);
        roleSelect.innerHTML = '<option value="">Error loading roles</option>'; // Сообщаем об ошибке
        // alert("Error loading roles."); // Можно убрать alert
    }
}

// Загрузка пользователей
async function loadUsers() {
    const usersTable = document.getElementById("usersTable");
    if (!usersTable) return;
    try {
        const users = await fetchData("/admin/users");
        const currentUser = await fetchData("/api/auth/me");
        usersTable.innerHTML = ""; // Очищаем

        users.forEach(user => {
            const isActive = user.username === currentUser.username;
            const rolesString = user.roles?.map(role => role.name).join(", ") || "N/A"; // Безопасный доступ к ролям
            const row = document.createElement("tr");
            row.className = isActive ? "active-user" : "";

            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${rolesString}</td>
                <td>
                    ${isActive ? "Active User" : `
                        <select class="role-select" data-user-id="${user.id}">
                            <option value="ROLE_USER" ${user.roles?.some(r => r.name === "ROLE_USER") ? "selected" : ""}>USER</option>
                            <option value="ROLE_ADMIN" ${user.roles?.some(r => r.name === "ROLE_ADMIN") ? "selected" : ""}>ADMIN</option>
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
        usersTable.innerHTML = '<tr><td colspan="4">Error loading users.</td></tr>';
        // alert("Error loading users.");
    }
}

// Загрузка оборудования
async function loadEquipment() {
    const equipmentTable = document.getElementById("equipmentTable");
    if (!equipmentTable) return;
    try {
        const equipmentList = await fetchData("/api/equipment");
        equipmentTable.innerHTML = "";

        if (!equipmentList || equipmentList.length === 0) { // Проверка на пустой список
            equipmentTable.innerHTML = `<tr><td colspan="6">No equipment available.</td></tr>`;
            return;
        }

        equipmentList.forEach(equipment => {
            const row = `
                <tr>
                    <td>${equipment.id}</td>
                    <td>${equipment.name || "N/A"}</td>
                    <td>${equipment.serialNumber || "N/A"}</td>
                    <td>${equipment.status || "N/A"}</td>
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
        equipmentTable.innerHTML = `<tr><td colspan="6">Error loading equipment.</td></tr>`;
        // alert("Failed to load equipment.");
    }
}

// Загрузка документов
async function loadDocuments() {
    const documentTable = document.getElementById("documentTable");
    if (!documentTable) return;
    try {
        const documents = await fetchData("/api/documents");
        documentTable.innerHTML = "";

        if (!documents || documents.length === 0) { // Проверка на пустой список
            documentTable.innerHTML = `<tr><td colspan="4">No documents available.</td></tr>`; // Исправлено colspan
            return;
        }

        documents.forEach(doc => {
            const row = `
                <tr>
                    <td>${doc.id}</td>
                    <td>${doc.name || "N/A"}</td>
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
        documentTable.innerHTML = `<tr><td colspan="4">Error loading documents.</td></tr>`; // Исправлено colspan
        // alert("Error loading documents.");
    }
}

// Загрузка ВСЕХ заказов для админ-панели
async function loadAllOrders() {
    console.log("loadAllOrders: Function called.");
    const ordersTableBody = document.getElementById("ordersTable")?.querySelector("tbody");

    if (!ordersTableBody) {
        console.error("loadAllOrders: Cannot find orders table body (tbody)!");
        return;
    }
    ordersTableBody.innerHTML = '<tr><td colspan="5">Loading orders...</td></tr>'; // Показываем статус загрузки

    try {
        const orders = await fetchData("/api/orders/all");
        console.log("loadAllOrders: Fetched data:", orders);

        ordersTableBody.innerHTML = ""; // Очищаем перед рендерингом

        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            console.log("loadAllOrders: No orders found or data is not an array.");
            ordersTableBody.innerHTML = '<tr><td colspan="5">No orders found.</td></tr>';
            return;
        }

        orders.forEach(order => {
            console.log("loadAllOrders: Processing order:", order);

            const username = order.user?.username || "N/A";
            const equipmentName = order.equipment?.name || "N/A";
            const currentStatus = order.status || "Unknown";

            const statusOptions = ["Создан", "На проверке", "Подтвержден", "В обработке", "Доставлен"]
                .map(status => `<option value="${status}" ${currentStatus === status ? "selected" : ""}>${status}</option>`)
                .join("");

            const row = `
                <tr>
                    <td>${order.id}</td>
                    <td>${username}</td>
                    <td>${equipmentName}</td>
                    <td>
                        <select class="status-select" data-order-id="${order.id}">
                            ${statusOptions}
                        </select>
                    </td>
                    <td>
                        <button class="save-status-btn" data-order-id="${order.id}">Save Status</button>
                        <button class="delete-order-btn" data-order-id="${order.id}">Delete</button>
                    </td>
                </tr>`;
            // console.log("loadAllOrders: Appending row HTML:", row); // Можно раскомментировать для детальной отладки
            ordersTableBody.insertAdjacentHTML("beforeend", row);
        });

    } catch (error) {
        console.error("loadAllOrders: CATCH block - Failed to load or render orders:", error);
        ordersTableBody.innerHTML = '<tr><td colspan="5">Error loading orders. Check console.</td></tr>';
    }
}


// --- Инициализация страницы и обработчики событий ---

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Admin Panel Initializing..."); // Лог начала инициализации

    // Обработчик логаута
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                await fetch("/logout", { method: "POST", credentials: 'include' }); // Добавлены credentials
                // alert("Logged out successfully!"); // Можно убрать alert
                window.location.href = "/"; // Перенаправление на главную
            } catch (error) {
                console.error("Failed to logout:", error);
                alert("Error during logout.");
            }
        });
    }

    // Назначение обработчиков для форм добавления
    const addUserForm = document.getElementById("addUserForm");
    const addEquipmentForm = document.getElementById("addEquipmentForm");
    const addDocumentForm = document.getElementById("addDocumentForm");

    if (addUserForm) {
        addUserForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("newUsername").value.trim();
            const password = document.getElementById("newPassword").value.trim();
            const roleSelect = document.getElementById("roleSelect"); // Получаем select
            const roleId = roleSelect?.value; // Безопасно получаем value

            if (!roleId) {
                 alert("Please select a role.");
                 return;
            }

            if (!validateUsername(username)) {
                alert("Invalid username format.");
                return;
            }
            if (!validatePassword(password)) {
                alert("Invalid password format.");
                return;
            }

            try {
                const response = await fetchData("/admin/users", "POST", { username, password, roleId });
                alert(response.message || "User added successfully.");
                await loadUsers(); // Обновляем список пользователей
                addUserForm.reset(); // Очищаем форму
            } catch (error) {
                console.error("Failed to add user:", error);
                 // Попробуем извлечь сообщение об ошибке, если бэкенд его вернул
                 const errorMessage = error.responseBody?.error || error.data?.error || error.message || "Error adding user.";
                alert(errorMessage);
            }
        });
    }

    if (addEquipmentForm) {
        addEquipmentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("equipmentName").value.trim();
            const serialNumber = document.getElementById("equipmentSerialNumber").value.trim();
            const description = document.getElementById("equipmentDescription").value.trim();

            if (!name || !serialNumber) {
                alert("Name and Serial Number are required.");
                return;
            }
            // Добавить валидацию серийного номера, если нужно

            try {
                 // Убедимся, что эндпоинт правильный (возможно /api/equipment или /admin/equipment)
                 // Предположим, что админ добавляет через /api/equipment, но с проверкой роли на бэкенде
                const response = await fetchData("/api/equipment", "POST", { name, serialNumber, description });
                alert(response.message || "Equipment added successfully.");
                await loadEquipment(); // Обновляем список
                addEquipmentForm.reset(); // Очищаем форму
            } catch (error) {
                console.error("Failed to add equipment:", error);
                 const errorMessage = error.responseBody?.error || error.data?.error || error.message || "Error adding equipment.";
                alert(errorMessage);
            }
        });
    }

    if (addDocumentForm) {
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
                 // Проверяем ответ сервера на наличие поля error (на случай, если fetchData не бросил ошибку)
                 if (response.error) {
                     throw new Error(response.error);
                 }
                alert(response.message || "Document added successfully.");
                await loadDocuments(); // Обновляем список
                addDocumentForm.reset(); // Очищаем форму
            } catch (error) {
                console.error("Failed to add document:", error);
                alert(`Error adding document: ${error.message}`);
            }
        });
    }

    // Назначение обработчиков для таблиц (делегирование событий)
    const usersTable = document.getElementById("usersTable");
    const equipmentTable = document.getElementById("equipmentTable");
    const documentTable = document.getElementById("documentTable");
    const ordersTable = document.getElementById("ordersTable"); // Получаем таблицу заказов

    if (usersTable) {
        usersTable.addEventListener("click", async (e) => {
            const target = e.target;
            const userId = target.dataset.userId;

            if (target.classList.contains("change-role-btn") && userId) {
                const selectElement = target.closest('td')?.querySelector(".role-select"); // Ищем select в той же ячейке
                const newRole = selectElement?.value;
                if (!newRole) return;

                console.log(`Changing role for user ${userId} to ${newRole}`);
                try {
                    // Отправляем {"role": "..."}
                    const response = await fetchData(`/admin/users/${userId}/role`, "PUT", { role: newRole });
                    alert(response.message || "Role changed successfully.");
                    await loadUsers();
                } catch (error) {
                    console.error("Failed to change role:", error);
                    alert("Error changing role.");
                }
            }

            if (target.classList.contains("delete-user-btn") && userId) {
                 if (confirm(`Are you sure you want to delete user #${userId}?`)) {
                    console.log(`Deleting user ${userId}`);
                    try {
                        await fetchData(`/admin/users/${userId}`, "DELETE");
                        alert("User deleted successfully!");
                        await loadUsers();
                    } catch (error) {
                        console.error("Failed to delete user:", error);
                         const errorMessage = error.responseBody?.error || error.data?.error || error.message || "Error deleting user.";
                         alert(errorMessage); // Показываем сообщение об ошибке (например, "нельзя удалить себя")
                    }
                }
            }
        });
    }

    if (equipmentTable) {
        equipmentTable.addEventListener("click", async (e) => {
            const target = e.target;
            const equipmentId = target.dataset.equipmentId;

            if (target.classList.contains("delete-equipment-btn") && equipmentId) {
                 if (confirm(`Are you sure you want to delete equipment #${equipmentId}?`)) {
                    console.log(`Deleting equipment ${equipmentId}`);
                    try {
                         // Убедимся, что эндпоинт правильный (/api/equipment/id или /admin/equipment/id)
                         // Используем /api/equipment/id с проверкой роли на бэкенде
                        await fetchData(`/api/equipment/${equipmentId}`, "DELETE");
                        alert("Equipment deleted successfully.");
                        await loadEquipment();
                    } catch (error) {
                        console.error("Failed to delete equipment:", error);
                        alert("Error deleting equipment.");
                    }
                }
            }
        });
    }

    if (documentTable) {
        documentTable.addEventListener("click", async (e) => {
            const target = e.target;
            const documentId = target.dataset.documentId;

            if (target.classList.contains("delete-document-btn") && documentId) {
                 if (confirm(`Are you sure you want to delete document #${documentId}?`)) {
                    console.log(`Deleting document ${documentId}`);
                    try {
                        await fetchData(`/api/documents/${documentId}`, "DELETE");
                        alert("Document deleted successfully.");
                        await loadDocuments();
                    } catch (error) {
                        console.error("Failed to delete document:", error);
                        alert("Error deleting document.");
                    }
                }
            }
        });
    }

    // --- ЕДИНЫЙ ОБРАБОТЧИК ДЛЯ ТАБЛИЦЫ ЗАКАЗОВ ---
    if (ordersTable) {
        ordersTable.addEventListener("click", async (e) => {
            const target = e.target; // Элемент, по которому кликнули

            // Обработка кнопки сохранения статуса
            if (target.classList.contains("save-status-btn")) {
                const orderId = target.dataset.orderId;
                // Ищем select В ТОЙ ЖЕ СТРОКЕ (tr) что и кнопка
                const selectElement = target.closest('tr')?.querySelector(".status-select");

                if (!orderId || !selectElement) {
                    console.error("Could not find order ID or status select element for save button:", target);
                    return;
                }
                const newStatus = selectElement.value;
                console.log(`Saving status for order ${orderId}: ${newStatus}`);

                try {
                    // !!! Отправляем JSON: { "status": "новый_статус" } !!!
                    // !!! Требуется изменение OrderController.updateOrderStatus !!!
                    const response = await fetchData(`/api/orders/${orderId}/status`, "PUT", { status: newStatus });

                    // Проверяем ответ сервера (fetchData должен бросить ошибку при !response.ok)
                    console.log("Status update response:", response); // Логируем ответ (может быть пустым или содержать обновленный ордер)
                    alert("Order status updated!");
                    // Не перезагружаем всю таблицу, т.к. статус в select уже верный
                    // await loadAllOrders();

                } catch (error) {
                    console.error("Failed to update order status:", error);
                     const errorMessage = error.responseBody?.error || error.data?.error || error.message || "Error updating status.";
                    alert(`Error updating order status: ${errorMessage}`);
                }
            }

            // Обработка кнопки удаления заказа
            if (target.classList.contains("delete-order-btn")) {
                const orderId = target.dataset.orderId;
                if (!orderId) {
                     console.error("Could not find order ID for delete button:", target);
                     return;
                }
                console.log(`Attempting to delete order ${orderId}`);

                if (confirm(`Are you sure you want to delete order #${orderId}?`)) {
                    try {
                        await fetchData(`/api/orders/${orderId}`, "DELETE");
                        alert("Order deleted successfully!");
                        await loadAllOrders(); // Обновляем список заказов после удаления
                    } catch (error) {
                        console.error("Failed to delete order:", error);
                         const errorMessage = error.responseBody?.error || error.data?.error || error.message || "Error deleting order.";
                        alert(`Error deleting order: ${errorMessage}`);
                    }
                }
            }
        });
    } else {
         console.warn("Orders table element not found!");
    }


    // Загрузка начальных данных
    try {
        console.log("Loading initial data...");
        await loadRoles();
        await loadUsers();
        await loadEquipment();
        await loadDocuments();
        await loadAllOrders(); // Загружаем заказы
        console.log("Initial data load complete.");
    } catch (error) {
        console.error("Initialization failed during data loading:", error);
        alert("Failed to initialize some parts of the admin panel.");
    }

    console.log("Admin Panel Initialization Complete.");
});