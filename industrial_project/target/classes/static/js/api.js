const API_BASE_URL = "";

export async function fetchData(url, method = "GET", body = null) {
    // Определяем заголовки по умолчанию
    const headers = { "Accept": "application/json" }; // Говорим серверу, что предпочитаем JSON
    const options = { method, headers, credentials: "include" };

    // Добавляем Content-Type и тело только для методов, которые их обычно имеют
    // и если тело предоставлено
    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        // Если тело - объект, и мы не указали другой Content-Type, считаем его JSON
        if (typeof body === 'object' && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        } else {
             // Если тело уже строка или другой тип, или Content-Type задан, используем как есть
             // Например, для отправки text/plain
            if (!headers['Content-Type'] && typeof body === 'string') {
                 headers['Content-Type'] = 'text/plain'; // Предполагаем text/plain для строк по умолчанию
            }
            options.body = body;
        }
    }
     // Устанавливаем обновленные заголовки
     options.headers = headers;


    try {
        const response = await fetch(url, options);

        // --- Обработка ошибок HTTP (статус не 2xx) ---
        if (!response.ok) {
            let errorData = { message: `Request failed with status ${response.status}` };
            try {
                // Пытаемся получить тело ошибки как JSON
                errorData = await response.json();
            } catch (jsonError) {
                try {
                    // Если не JSON, пробуем получить как текст
                    errorData.rawText = await response.text();
                    // Используем начало текста ошибки в сообщении, если нет message
                    if (errorData.rawText && !errorData.message) {
                         errorData.message = errorData.rawText.substring(0, 150); // Ограничим длину
                    }
                } catch (textError) { /* Игнорируем ошибку чтения текста */ }
            }
            // Создаем ошибку и прикрепляем детали
            const error = new Error(errorData.message || `Request failed with status ${response.status}`);
            error.responseBody = errorData;
            error.status = response.status;
            throw error; // Выбрасываем ошибку для перехвата в вызывающем коде
        }

        // --- Обработка успешных ответов (статус 2xx) ---

        // 1. Проверяем статус 204 No Content
        if (response.status === 204) {
            console.log(`fetchData: Received 204 No Content for ${method} ${url}`);
            return null; // Или можно вернуть true, чтобы показать успех
        }

        // 2. Проверяем, есть ли вообще тело ответа (по Content-Length или типу)
        // Некоторые API могут возвращать 200 OK, но с пустым телом для DELETE
        const contentType = response.headers.get("content-type");
        const contentLength = response.headers.get("content-length");

        if (contentLength === "0" || !contentType || !contentType.includes("application/json")) {
             // Если длина 0, или тип не JSON, не пытаемся парсить JSON
             console.log(`fetchData: Received ${response.status} for ${method} ${url} without JSON body (Content-Length: ${contentLength}, Content-Type: ${contentType}).`);
             // Пытаемся вернуть текст, если он может быть полезен, иначе null
             try {
                 const text = await response.text();
                 // Вернем текст только если он не пустой
                 return text || null; // или true
             } catch(e) {
                 return null; // или true
             }
        }

        // 3. Если это успешный ответ (не 204) И ожидается JSON, парсим его
        try {
            return await response.json();
        } catch (e) {
             // Если парсинг JSON не удался даже при успешном статусе
             console.error(`fetchData: Successfully received ${response.status} for ${method} ${url}, but failed to parse body as JSON.`, e);
             // Бросаем ошибку, т.к. ожидали JSON, но не получили
             throw new Error("Received invalid JSON format from server.");
        }

    } catch (error) {
        // Логируем и перебрасываем любую ошибку (HTTP или парсинга)
        console.error(`Fetch Error in fetchData for ${method} ${url}:`, error.message);
         // Если есть детали ответа, тоже логируем
         if (error.responseBody) {
             console.error("Error details:", error.responseBody);
         }
        throw error; // Перебрасываем, чтобы вызывающий код мог ее обработать
    }
}

