const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
  
    const url = search(address.value, searchEngine.value);
    address.value = "";
  
    location.href = "/tab?page=" + __uv$config.encodeUrl(url);
  });

document.addEventListener("DOMContentLoaded", () => {
    const stored = localStorage.getItem("ksf_search_engine");
    if (stored) {
        const se = document.getElementById("uv-search-engine");
        if (se) se.value = stored;
    }
});