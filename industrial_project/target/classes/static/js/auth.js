import { fetchData } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const authButton = document.getElementById("authButton");
    const logoutButton = document.getElementById("logoutButton");
    const adminButton = document.getElementById("adminButton");
    const userInfo = document.getElementById("userInfo");

    if (!authButton || !logoutButton || !adminButton || !userInfo) {
        console.error("Error: Missing DOM elements!");
        return;
    }

    async function checkSession() {
        try {
            const response = await fetchData("/api/auth/me");
            const { username, roles } = response;

            // Обновление интерфейса
            userInfo.textContent = `Hello, ${username}`;
            authButton.style.display = "none";
            logoutButton.style.display = "inline-block";

            if (roles.includes("ROLE_ADMIN")) {
                adminButton.style.display = "inline-block";
            }
        } catch (error) {
            console.error("Failed to fetch session:", error);
            authButton.style.display = "inline-block";
            logoutButton.style.display = "none";
            adminButton.style.display = "none";
            userInfo.textContent = "";
        }
    }

    // Logout обработчик
    logoutButton.addEventListener("click", async () => {
        try {
            await fetch("/logout", { method: "POST", credentials: "include" });
            window.location.reload();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    });

    // Проверяем сессию при загрузке
    await checkSession();

    function validateUsername(username) {
        const usernameRegex = /^[A-Z][a-zA-Z0-9_]{5,19}$/;
        return usernameRegex.test(username);
    }
    
    function validatePassword(password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;
        return passwordRegex.test(password);
    }

    // Открытие popup логина
    authButton.addEventListener("click", () => {
        console.log("Opening login popup...");
        loginPopup.classList.remove("hidden");
    });

    // Переключение на popup регистрации
    showRegister.addEventListener("click", () => {
        console.log("Switching to register popup...");
        loginPopup.classList.add("hidden");
        registerPopup.classList.remove("hidden");
    });

    // Обработчик формы логина
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
    
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
    
        try {
            const formData = new URLSearchParams();
            formData.append("username", username);
            formData.append("password", password);
    
            console.log(`Sending login request for user: ${username}`);
            const response = await fetch("/perform_login", {
                method: "POST",
                body: formData,
                credentials: "include", // Отправляем куки
            });
    
            if (response.ok) {
                const data = await response.json();
                alert(data.message); // Сообщение об успешном входе
                window.location.reload();
            } else if (response.status === 401) {
                const errorData = await response.json();
                document.getElementById("loginError").innerText = errorData.error;
            } else {
                document.getElementById("loginError").innerText = "Unexpected error occurred.";
            }
        } catch (error) {
            console.error("Error occurred during login:", error);
            document.getElementById("loginError").innerText = "An error occurred. Please try again.";
        }
    });
    

    // Обработчик формы регистрации
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
    
        const username = document.getElementById("regUsername").value.trim();
        const password = document.getElementById("regPassword").value.trim();
    
        if (!validateUsername(username)) {
            document.getElementById("registerError").innerText = "Invalid username format.";
            return;
        }
    
        if (!validatePassword(password)) {
            document.getElementById("registerError").innerText = "Invalid password format.";
            return;
        }
    
        try {
            const response = await fetchData("/api/auth/register", "POST", { username, password });
            alert(response.message);
            registerPopup.classList.add("hidden");
            loginPopup.classList.remove("hidden");
        } catch (error) {
            console.error("Registration failed", error);
            document.getElementById("registerError").innerText = "Registration failed. " + (error.message || "");
        }
    });

    // Функция для закрытия popup
    window.closePopup = function () {
        console.log("Closing popup...");
        loginPopup.classList.add("hidden");
        registerPopup.classList.add("hidden");
    };
});
