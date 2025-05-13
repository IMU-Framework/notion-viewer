const pageId = "1e5b75a84d7e8037a156fefc949e0d34";

fetch(`/api/notion.js?pageId=${pageId}`)
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("notionContent");
    container.innerHTML = data.results.map(block => {
      const type = block.type;
      const text = block[type]?.rich_text?.map(rt => rt.plain_text).join("") || `[${type}]`;

      if (type === "paragraph") {
        return `<p class="text-base leading-relaxed">${text}</p>`;
      }
      if (type === "heading_1") {
        return `<h1 class="text-xl font-bold">${text}</h1>`;
      }
      if (type === "heading_2") {
        return `<h2 class="text-lg font-semibold">${text}</h2>`;
      }
      return `<div class="text-gray-500">[不支援的類型: ${type}]</div>`;
    }).join("");
  });
