
const pageId = "1e5b75a84d7e8037a156fefc949e0d34";

fetch(`/api/notion.js?pageId=${pageId}`)
  .then(res => res.json())
  .then(async ({ title, blocks }) => {
    document.title = `IMU - ${title}`;
    document.getElementById("pageTitle").textContent = title;

    const container = document.getElementById("notionContent");
    const html = await renderBlocks(blocks);
    container.innerHTML = html;
  });

async function renderBlocks(blocks) {
  const rendered = await Promise.all(blocks.map(async block => {
    if (block.has_children) {
      const childrenRes = await fetch(`/api/notion.js?pageId=${block.id}`);
      const childrenJson = await childrenRes.json();
      block.children = childrenJson.blocks;
    }
    return renderSingleBlock(block);
  }));
  return rendered.join("");
}

function renderSingleBlock(block) {
  const type = block.type;
  const value = block[type];
  const richText = value?.rich_text || [];

  switch (type) {
    case "paragraph":
      return `<p class="text-base leading-relaxed">${renderRichText(richText)}</p>`;

    case "heading_1":
    case "heading_2":
    case "heading_3":
      const headingClass = {
        heading_1: "text-3xl font-bold mt-6 mb-2",
        heading_2: "text-2xl font-semibold mt-5 mb-2",
        heading_3: "text-xl font-medium mt-4 mb-2"
      }[type];

      if (block.has_children && block[type].is_toggleable) {
        return `
          <details class="bg-gray-100 rounded-lg px-4 py-3 my-4 shadow-sm">
            <summary class="${headingClass} cursor-pointer">${renderRichText(richText)}</summary>
            <div class="ml-4 mt-2">${block.children ? renderBlocksSync(block.children) : ""}</div>
          </details>`;
      } else {
        return `<h${type.slice(-1)} class="${headingClass}">${renderRichText(richText)}</h${type.slice(-1)}>`;
      }

    case "bulleted_list_item":
      return `<ul class="list-disc ml-6"><li>${renderRichText(richText)}</li></ul>`;

    case "numbered_list_item":
      return `<ol class="list-decimal ml-6"><li>${renderRichText(richText)}</li></ol>`;

    case "divider":
      return `<hr class="page-break" />`;

    case "toggle":
      return `
        <details class="bg-gray-100 rounded-lg px-4 py-3 my-4 shadow-sm">
          <summary class="cursor-pointer font-semibold">${renderRichText(richText)}</summary>
          <div class="ml-4 mt-2">${block.children ? renderBlocksSync(block.children) : ""}</div>
        </details>`;

    case "callout":
      return `<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        ${renderRichText(richText)}
      </div>`;

    case "code":
      return `<pre class="bg-gray-900 text-white text-sm p-4 rounded overflow-x-auto"><code>${escapeHTML(value.text[0]?.plain_text || "")}</code></pre>`;

    case "image":
      const imgSrc = value.type === "external" ? value.external.url : value.file.url;
      return `<div class="my-4"><img src="${imgSrc}" alt="" class="rounded shadow max-w-full" /></div>`;

    case "table":
      return renderTableBlock(block);

    default:
      return `<div class="text-gray-400">[不支援的 block 類型: ${type}]</div>`;
  }
}

function renderBlocksSync(blocks) {
  return blocks.map(renderSingleBlock).join("");
}

function renderTableBlock(block) {
  const rows = block.children || [];
  const hasHeader = block.table?.has_column_header;
  const headerRow = hasHeader ? rows[0] : null;
  const bodyRows = hasHeader ? rows.slice(1) : rows;

  const thead = hasHeader ? `
    <thead class="bg-gray-100 text-left font-bold text-sm">
      <tr>
        ${headerRow.table_row.cells.map(cell => `<th class="border border-gray-300 px-4 py-2">${renderRichText(cell)}</th>`).join("")}
      </tr>
    </thead>` : "";

  const tbody = `
    <tbody class="divide-y divide-gray-200">
      ${bodyRows.map(row => `
        <tr class="even:bg-gray-50">
          ${row.table_row.cells.map(cell => `<td class="border border-gray-300 px-4 py-2 text-sm">${renderRichText(cell)}</td>`).join("")}
        </tr>`).join("")}
    </tbody>`;

  return `<div class="overflow-x-auto"><table class="table-auto border-collapse border border-gray-300 my-4 w-full text-sm">${thead}${tbody}</table></div>`;
}

function renderRichText(richTextArray) {
  return richTextArray.map(rt => {
    const text = escapeHTML(rt.plain_text);
    const ann = rt.annotations;
    const href = rt.href;

    const style = getNotionStyle(ann);
    const content = href
      ? `<a href="${href}" target="_blank" class="underline text-blue-600 hover:text-blue-800">${text}</a>`
      : `<span style="${style}">${text}</span>`;

    return content;
  }).join("");
}

function getNotionStyle(ann) {
  let style = "";
  if (ann.bold) style += "font-weight:bold;";
  if (ann.italic) style += "font-style:italic;";
  if (ann.underline) style += "text-decoration:underline;";
  if (ann.strikethrough) style += "text-decoration:line-through;";
  if (ann.code) style += "font-family:monospace;background-color:#f3f3f3;padding:0.2em;border-radius:0.2em;";

  const colorMap = {
    gray: "#6B7280", red: "#EF4444", orange: "#F97316", yellow: "#EAB308",
    green: "#10B981", blue: "#3B82F6", purple: "#8B5CF6", pink: "#EC4899",
    brown: "#92400E", default: "",

    gray_background: "#F3F4F6", red_background: "#FEE2E2", orange_background: "#FFEDD5",
    yellow_background: "#FEF9C3", green_background: "#D1FAE5", blue_background: "#DBEAFE",
    purple_background: "#EDE9FE", pink_background: "#FCE7F3", brown_background: "#EFEBE9"
  };

  const fg = ann.color.includes("background") ? "" : colorMap[ann.color] || "";
  const bg = ann.color.includes("background") ? colorMap[ann.color] || "" : "";

  if (fg) style += `color:${fg};`;
  if (bg) style += `background-color:${bg};padding:0.1em 0.25em;border-radius:0.2em;`;

  return style;
}

function escapeHTML(text) {
  return text.replace(/[&<>'"]/g, tag => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[tag]));
}

// 展開所有 toggle 區塊以便列印
window.addEventListener("beforeprint", () => {
  document.querySelectorAll("details").forEach(d => d.open = true);
});
