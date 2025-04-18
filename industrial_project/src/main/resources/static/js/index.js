import { fetchData } from "./api.js";

let currentUserId = null;

// Получение текущего пользователя
async function getCurrentUser() {
    try {
        const user = await fetchData("/api/auth/me");
        if (!user || !user.id) {
            throw new Error("User not authenticated.");
        }
        currentUserId = user.id;
    } catch (error) {
        console.error("Failed to fetch current user:", error);
        alert("Authentication required. Please log in.");
    }
}


// Загрузка списка оборудования
async function loadEquipment() {
    try {
        const equipmentList = await fetchData("/api/equipment");

        const equipmentSelect = document.getElementById("equipmentSelect");
        if (!equipmentList || equipmentList.length === 0) {
            equipmentSelect.innerHTML = '<option value="">No Equipment Available</option>';
            return;
        }

        equipmentSelect.innerHTML = '<option value="">Select Equipment</option>';
        equipmentList.forEach(equipment => {
            const option = document.createElement("option");
            option.value = equipment.id;
            option.textContent = `${equipment.name} (SN: ${equipment.serialNumber})`;
            equipmentSelect.appendChild(option);
        });
    } catch (error) {

        const user = await fetchData("/api/auth/me");
        if (!user || !user.id) {
            console.warn("User is not authenticated. Skipping equipment load.");
        } else {
            console.error("Failed to load equipment:", error);
            alert("Error loading equipment.");
        }
    }
}


// Оформление заказа
async function placeOrder(e) {
    e.preventDefault();

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
        if (!ordersTable) {
            console.error("Orders table not found!");
            return;
        }

        ordersTable.innerHTML = ""; // Очистка таблицы перед загрузкой новых данных
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
        const user = await fetchData("/api/auth/me");
        if (!user || !user.id) {
            console.warn("User is not authenticated. Skipping orders load.");
        } else {
            console.error("Failed to load user orders:", error);
            alert("Error loading orders.");
        }
    }
}


// Загрузка документов
async function loadDocuments() {
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
    try {
        await getCurrentUser();
        await loadEquipment();
        await loadUserOrders();
    } catch (error) {
        console.error("Initialization error:", error);
    }
});

document.getElementById("orderForm").addEventListener("submit", placeOrder);
