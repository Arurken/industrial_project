import { fetchData } from "./api.js";

let currentUserId = null;

// Получение текущего пользователя
async function getCurrentUser() {
    try {
        const user = await fetchData("/api/auth/me");
        if (!user || !user.id) {
            // Можно выбросить ошибку или просто вернуть null/undefined
            throw new Error("User data incomplete or not authenticated.");
        }
        currentUserId = user.id;
        return user; // Возвращаем пользователя для дальнейшего использования
    } catch (error) {
        console.warn("Failed to fetch current user (likely not logged in):", error);
        currentUserId = null;
        throw error; // Перебрасываем ошибку, чтобы ее поймал вызывающий код
    }
}


// Загрузка списка оборудования
async function loadEquipment() {
    try {
        const equipmentList = await fetchData("/api/equipment");
        const equipmentSelect = document.getElementById("equipmentSelect");
        // ... (код заполнения select) ...
         equipmentSelect.innerHTML = '<option value="">Select Equipment</option>';
         equipmentList.forEach(equipment => {
             const option = document.createElement("option");
             option.value = equipment.id;
             option.textContent = `${equipment.name} (SN: ${equipment.serialNumber})`;
             equipmentSelect.appendChild(option);
         });
    } catch (error) {
        // Эта ошибка теперь должна возникать только если что-то не так ПОСЛЕ логина
        console.error("Failed to load equipment:", error);
        alert("An error occurred while loading equipment."); // Сообщаем о РЕАЛЬНОЙ проблеме
        document.getElementById("equipmentSelect").innerHTML = '<option value="">Error loading equipment</option>';
    }
}



// Оформление заказа
async function placeOrder(e) {
    e.preventDefault();

    if (!currentUserId) {
        alert("Authentication required. Please log in.");
        return; // Прерываем выполнение, если пользователь не залогинен
    }

    const equipmentId = document.getElementById("equipmentSelect").value;
    if (!equipmentId) {
        alert("Please select equipment.");
        return;
    }

    try {
        const response = await fetchData("/api/orders", "POST", {
            equipmentId: parseInt(equipmentId, 10) // Преобразование ID в число
        });

        if (response.error) {
            alert(`Error: ${response.error}`);
        } else {
            alert("Order placed successfully!");
            await loadUserOrders();
        }
    } catch (error) {
        console.error("Failed to place order:", error);
        alert(`Error placing order: ${error.message}`);
    }
}


 

// Загрузка заказов пользователя
async function loadUserOrders() {
    try {
        const orders = await fetchData("/api/orders/user");
        const ordersTable = document.getElementById("userOrdersTable").querySelector("tbody");
        // ... (код заполнения таблицы) ...
         ordersTable.innerHTML = "";
         orders.forEach(order => {
             const row = `
                 <tr>
                     <td>${order.id}</td>
                     <td>${order.equipment ? order.equipment.name : "N/A"}</td>
                     <td>${order.status}</td>
                 </tr>`;
             ordersTable.insertAdjacentHTML("beforeend", row);
         });
    } catch (error) {
         // Эта ошибка теперь должна возникать только если что-то не так ПОСЛЕ логина
        console.error("Failed to load user orders:", error);
        alert("An error occurred while loading your orders."); // Сообщаем о РЕАЛЬНОЙ проблеме
        document.getElementById("userOrdersTable").querySelector("tbody").innerHTML = '<tr><td colspan="3">Error loading orders.</td></tr>';
    }
}


// Загрузка документов
async function loadDocuments() {

    if (!currentUserId) {
        alert("Authentication required. Please log in.");
        return; // Прерываем выполнение, если пользователь не залогинен
    }

    try {
        const documents = await fetchData("/api/documents");
        const documentSelect = document.getElementById("documentSelect");

        if (!documents || documents.length === 0) {
            documentSelect.innerHTML = '<option value="">No Documents Available</option>';
            return;
        }

        documentSelect.innerHTML = '';
        documents.forEach(doc => {
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = doc.name;
            documentSelect.appendChild(option);
        });

        document.getElementById("selectDocumentPopup").classList.remove("hidden");
    } catch (error) {
        console.error("Failed to load documents:", error);
        alert("Error loading documents.");
    }
}
// Обработчики событий
document.getElementById("viewDocumentationButton").addEventListener("click", loadDocuments);
document.getElementById("closeSelectDocumentPopup").addEventListener("click", () => {
    document.getElementById("selectDocumentPopup").classList.add("hidden");
});
document.getElementById("closeViewDocumentPopup").addEventListener("click", () => {
    document.getElementById("viewDocumentPopup").classList.add("hidden");
});
document.getElementById("viewDocumentButton").addEventListener("click", async () => {
    const selectedDocumentId = document.getElementById("documentSelect").value;

    try {
        const doc = await fetchData(`/api/documents/${selectedDocumentId}`);
        document.getElementById("documentTitle").textContent = doc.name;
        document.getElementById("documentDescription").textContent = doc.description || "No description available.";

        document.getElementById("selectDocumentPopup").classList.add("hidden");
        document.getElementById("viewDocumentPopup").classList.remove("hidden");
    } catch (error) {
        console.error("Failed to load document details:", error);
        alert("Error loading document details.");
    }
});

document.getElementById("logoutButton").addEventListener("click", async () => {
    await fetch("/logout", { method: "POST" });
    window.location.reload();
});

// Инициализация
document.addEventListener("DOMContentLoaded", async () => {
    let isAuthenticated = false;
    try {
        // 1. Пробуем получить данные пользователя. Если успешно - он залогинен.
        const user = await fetchData("/api/auth/me");
        if (user && user.id) {
            currentUserId = user.id;
            isAuthenticated = true;
            console.log("User authenticated:", user.username);
            // Обновляем UI, если нужно (хотя auth.js это тоже делает)
             document.getElementById("userInfo").textContent = `Hello, ${user.username}`;
        }
    } catch (error) {
        // Ошибка при запросе /api/auth/me ОЗНАЧАЕТ, что пользователь не залогинен.
        // Это ОЖИДАЕМОЕ поведение, НЕ показываем alert.
        console.log("User is not authenticated.");
        isAuthenticated = false;
        currentUserId = null;
         // Убедимся, что UI отражает состояние "не залогинен"
         document.getElementById("userInfo").textContent = "";
         document.getElementById("equipmentSelect").innerHTML = '<option value="">Log in to select equipment</option>';
         document.getElementById("userOrdersTable").querySelector("tbody").innerHTML = '<tr><td colspan="3">Log in to view your orders.</td></tr>';
    }

    // 2. Если пользователь аутентифицирован, загружаем защищенные данные
    if (isAuthenticated) {
        try {
            // Теперь вызываем эти функции только если пользователь ТОЧНО залогинен
            await loadEquipment();
            await loadUserOrders();
        } catch (loadError) {
            // Эти ошибки теперь будут означать реальные проблемы при загрузке данных,
            // а не просто отсутствие логина. Они уже обрабатываются внутри функций.
            console.error("Error loading data after authentication:", loadError);
        }
    } else {
        // Можно дополнительно очистить или показать заглушки для equipment/orders,
        // если это не было сделано в блоке catch выше.
        console.log("Skipping load of protected data as user is not authenticated.");
    }

    // 3. Всегда загружаем/настраиваем то, что не требует логина (если такое есть)
    // Например, обработчики кнопок Login/Logout (ими управляет auth.js)
    // или обработчик кнопки View Documentation, если документы публичны
    // (но ваш /api/documents требует логина)

    // 4. Назначаем обработчики событий, которые не зависят от данных
    document.getElementById("orderForm").addEventListener("submit", placeOrder);
    document.getElementById("viewDocumentationButton").addEventListener("click", loadDocuments);
    // Добавьте сюда другие обработчики, если они есть и должны работать всегда

     // Убедитесь, что auth.js также корректно обновляет видимость кнопок Login/Logout/Admin
});

document.getElementById("orderForm").addEventListener("submit", placeOrder);
