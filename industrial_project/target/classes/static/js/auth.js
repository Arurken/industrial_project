import { fetchData } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const authButton = document.getElementById("authButton");
    const logoutButton = document.getElementById("logoutButton");
    const adminButton = document.getElementById("adminButton");
    const userInfo = document.getElementById("userInfo");
    const registerPopup = document.getElementById("registerPopup");
    const loginPopup = document.getElementById("loginPopup");
    const passwordHint = document.getElementById("passwordHint");
    const showRegister = document.getElementById("showRegister");
    const loginForm = document.getElementById("loginForm"); // Added for clarity
    const registerForm = document.getElementById("registerForm"); // Added for clarity


    if (!authButton || !logoutButton || !adminButton || !userInfo || !loginForm || !registerForm) {
        console.error("Error: Missing DOM elements!");
        return;
    }

    async function checkSession() {
        console.log("checkSession: Starting check..."); // Добавлено
        try {
            // Используем fetch напрямую для большей прозрачности на этом этапе
            const fetchResponse = await fetch("/api/auth/me", {
                 method: "GET",
                 headers: { "Accept": "application/json" }, // Укажем, что ожидаем JSON
                 credentials: "include" // Важно для куки
             });
    
            console.log("checkSession: Raw fetch response status:", fetchResponse.status); // Добавлено
    
            if (!fetchResponse.ok) {
                 // Если статус не 2xx, выбрасываем ошибку
                 console.error(`checkSession: Fetch failed with status ${fetchResponse.status}`); // Добавлено
                 throw new Error(`HTTP error! Status: ${fetchResponse.status}`);
            }
    
            const responseData = await fetchResponse.json(); // Пытаемся распарсить JSON
            console.log("checkSession: Parsed response data from /api/auth/me:", responseData); // Добавлено
    
            // Проверка, что получили объект и нужные поля
            if (!responseData || typeof responseData !== 'object') {
                 console.error("checkSession: Invalid response data (not an object)."); // Добавлено
                 throw new Error("Invalid response structure from /api/auth/me");
            }
    
            const { username, roles } = responseData; // Деструктуризация
            console.log("checkSession: Destructured - username:", username, "roles:", roles); // Добавлено
    
            // Дополнительная проверка наличия и типа данных
            if (username === undefined || typeof username !== 'string' || !Array.isArray(roles)) {
                 console.error("checkSession: Incomplete or invalid data (username/roles missing or wrong type)."); // Добавлено
                 throw new Error("Incomplete or invalid user data received.");
            }
    
            // --- Если все проверки пройдены, обновляем UI ---
            console.log("checkSession: Data OK. Updating UI for logged-in user:", username); // Добавлено
            userInfo.textContent = `Hello, ${username}`;
            authButton.style.display = "none";
            logoutButton.classList.remove('hidden');
    
            if (roles.includes("ROLE_ADMIN")) {
                console.log("checkSession: User is ADMIN."); // Добавлено
                adminButton.classList.remove('hidden');
            } else {
                console.log("checkSession: User is not ADMIN."); // Добавлено
                adminButton.classList.add('hidden'); // Скрываем кнопку админа, если не админ
            }
            console.log("checkSession: UI update complete (logged in)."); // Добавлено
    
        } catch (error) {
            // --- Если произошла ЛЮБАЯ ошибка выше ---
            console.warn("checkSession: Caught error (likely not logged in or server issue):", error.message); // Изменено на warn
            console.log("checkSession: Updating UI for logged-out state."); // Добавлено
    
            authButton.style.display = "inline-block";
            logoutButton.classList.add('hidden'); // !!! СКРЫВАЕМ КНОПКУ ВЫХОДА !!!
            adminButton.classList.add('hidden');
            userInfo.textContent = "";
            console.log("checkSession: UI update complete (logged out)."); // Добавлено
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

    // --- НОВАЯ ФУНКЦИЯ ДЛЯ ЛОГИНА ---
    async function performLogin(username, password) {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        console.log(`Attempting login for user: ${username}`);
        try {
            const response = await fetch("/perform_login", {
                method: "POST",
                body: formData,
                credentials: "include", // Важно для куки
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Login successful:", data.message);
                return { success: true, message: data.message };
            } else {
                let errorMessage = "Login failed.";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    console.warn("Could not parse login error response body.");
                }
                console.error("Login failed:", response.status, errorMessage);
                return { success: false, message: errorMessage };
            }
        } catch (error) {
            console.error("Error occurred during login request:", error);
            return { success: false, message: "Network or server error during login." };
        }
    }
    // --- КОНЕЦ НОВОЙ ФУНКЦИИ ---

    // Открытие popup логина
    authButton.addEventListener("click", () => {
        console.log("Opening login popup...");
        loginPopup.classList.remove("hidden");
        registerPopup.classList.add("hidden"); // Скрыть другой попап
        passwordHint.classList.add("hidden"); // Скрыть подсказку пароля
        document.getElementById("registerError").innerText = ""; // Очистить ошибки
        document.getElementById("loginError").innerText = "";
    });

    // Переключение на popup регистрации
    showRegister.addEventListener("click", (e) => {
        e.preventDefault(); // Предотвратить переход по '#'
        console.log("Switching to register popup...");
        loginPopup.classList.add("hidden");
        registerPopup.classList.remove("hidden");
        passwordHint.classList.remove("hidden"); // Показать подсказку пароля
        document.getElementById("registerError").innerText = "";
        document.getElementById("loginError").innerText = "";
    });

    // Обработчик формы логина - ТЕПЕРЬ ИСПОЛЬЗУЕТ НОВУЮ ФУНКЦИЮ
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const loginErrorElement = document.getElementById("loginError");
        loginErrorElement.innerText = ""; // Очистить предыдущие ошибки

        const result = await performLogin(username, password);

        if (result.success) {
            // alert(result.message); // Можно убрать alert, т.к. страница все равно перезагрузится
            window.location.reload(); // Перезагружаем страницу для обновления состояния
        } else {
            loginErrorElement.innerText = result.message; // Показываем ошибку
        }
    });


    // Обработчик формы регистрации - ТЕПЕРЬ ВЫПОЛНЯЕТ ЛОГИН ПОСЛЕ РЕГИСТРАЦИИ
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("regUsername").value.trim();
        const password = document.getElementById("regPassword").value.trim();
        const registerErrorElement = document.getElementById("registerError");
        registerErrorElement.innerText = ""; // Очистить старые ошибки

        // Валидация на клиенте (остается)
        if (!validateUsername(username)) {
            registerErrorElement.innerText = "Invalid username format.";
            return;
        }
        if (!validatePassword(password)) {
            registerErrorElement.innerText = "Invalid password format.";
            return;
        }

        try {
            // 1. Выполняем регистрацию
            console.log("Attempting registration...");
            // Используем fetchData для регистрации, так как он обрабатывает JSON и ошибки
            const registrationResponse = await fetchData("/api/auth/register", "POST", { username, password });

            // fetchData должен бросить ошибку, если response.ok == false,
            // поэтому если мы здесь, регистрация прошла успешно на сервере.
            console.log("Registration successful:", registrationResponse.message);
            // alert(registrationResponse.message || "Registration successful!"); // Можно убрать alert

            // 2. Если регистрация успешна, ВЫПОЛНЯЕМ ЛОГИН
            console.log("Attempting auto-login...");
            const loginResult = await performLogin(username, password);

            if (loginResult.success) {
                console.log("Auto-login successful.");
                // Логин успешен, закрываем попап и перезагружаем страницу
                closePopup(); // Используем уже существующую функцию
                window.location.reload();
            } else {
                // Логин НЕ удался (очень странно, если регистрация прошла)
                console.error("Auto-login failed after registration:", loginResult.message);
                registerErrorElement.innerText = `Registration succeeded, but auto-login failed: ${loginResult.message}. Please log in manually.`;
                // Можно переключить пользователя обратно на форму логина
                // registerPopup.classList.add("hidden");
                // loginPopup.classList.remove("hidden");
                // document.getElementById("loginError").innerText = `Auto-login failed: ${loginResult.message}`;
            }

        } catch (error) {
            // Ошибка при РЕГИСТРАЦИИ (перехвачена из fetchData)
            console.error("Registration failed:", error);
            let errorMessage = "Registration failed.";
             // Попытка извлечь сообщение из ошибки fetchData
             // Это зависит от того, как fetchData структурирует ошибки
             // Предположим, что ошибка может содержать тело ответа в свойстве 'responseBody' или 'data'
             if (error.responseBody && error.responseBody.message) {
                 errorMessage = error.responseBody.message;
             } else if (error.data && error.data.message) {
                errorMessage = error.data.message;
             } else if (error.message) {
                // Пробуем извлечь из основного сообщения, если там JSON ответа
                try {
                    const parsed = JSON.parse(error.message.substring(error.message.indexOf('{')));
                    errorMessage = parsed.message || errorMessage;
                } catch(e) {
                    errorMessage = error.message; // Используем как есть, если не JSON
                }
            }
            registerErrorElement.innerText = errorMessage;
        }
    });

    // Функция для закрытия popup
    // Убедимся, что она объявлена в правильной области видимости (глобальной или модуля)
    // Если используется как `onclick="closePopup()"` в HTML, она должна быть глобальной.
    // Если обработчики назначаются через JS, можно оставить ее здесь.
    // Для простоты сделаем ее глобальной, если она используется в onclick.
    window.closePopup = function () {
        console.log("Closing popup...");
        loginPopup.classList.add("hidden");
        registerPopup.classList.add("hidden");
        passwordHint.classList.add("hidden");
        document.getElementById("registerError").innerText = "";
        document.getElementById("loginError").innerText = "";
    };

     // Добавим слушатели на кнопки закрытия внутри попапов, если они есть и не используют onclick
     document.querySelectorAll('.popup .close-btn').forEach(btn => {
         btn.addEventListener('click', window.closePopup);
     });
});