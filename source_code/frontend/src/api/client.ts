// source_code/frontend/src/api/client.ts

const API_URL = "http://localhost:8080/api";

export const api = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getMembers: async () => {
    const res = await fetch(`${API_URL}/members`);
    if (!res.ok) throw new Error("Failed to fetch members");
    return res.json();
  },
  
  // Add more API calls here later
};