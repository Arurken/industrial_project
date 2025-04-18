const API_BASE_URL = "";

export async function fetchData(url, method = "GET", body = null) {
    const headers = { "Content-Type": "application/json" };
    const options = { method, headers, credentials: "include" }; // Важно: credentials: include

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error("Request failed");
        return response.json();
    } catch (error) {
        console.error("Fetch Error:", error);
        throw error;
    }
}

