
const pageId = "1e5b75a84d7e8037a156fefc949e0d34";

fetch(`/api/notion.js?pageId=${pageId}`)
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("notionContent");
    container.innerHTML = renderBlocks(data.results);
  });

function renderBlocks(blocks) {
  return blocks.map(block => {
    const type = block.type;
    const value = block[type];
    const richText = value?.rich_text || [];

    switch (type) {
      case "paragraph":
        return `<p class="text-base leading-relaxed">${renderRichText(richText)}</p>`;

      case "heading_1":
        return `<h1 class="text-3xl font-bold mt-6 mb-2">${renderRichText(richText)}</h1>`;

      case "heading_2":
        return `<h2 class="text-2xl font-semibold mt-5 mb-2">${renderRichText(richText)}</h2>`;

      case "heading_3":
        return `<h3 class="text-xl font-medium mt-4 mb-2">${renderRichText(richText)}</h3>`;

      case "bulleted_list_item":
        return `<ul class="list-disc ml-6"><li>${renderRichText(richText)}</li></ul>`;

      case "numbered_list_item":
        return `<ol class="list-decimal ml-6"><li>${renderRichText(richText)}</li></ol>`;

      case "divider":
        return `<hr class="my-6 border-gray-300"/>`;

      default:
        return `<div class="text-gray-400">[不支援的 block 類型: ${type}]</div>`;
    }
  }).join("");
}

function renderRichText(richTextArray) {
  return richTextArray.map(rt => {
    const text = rt.plain_text;
    const ann = rt.annotations;
    const href = rt.href;

    let classes = [];
    if (ann.bold) classes.push("font-bold");
    if (ann.italic) classes.push("italic");
    if (ann.underline) classes.push("underline");
    if (ann.strikethrough) classes.push("line-through");
    if (ann.code) classes.push("font-mono bg-gray-100 px-1 rounded");

    const colorClass = mapTextColor(ann.color);
    if (colorClass) classes.push(colorClass);

    const classString = classes.join(" ");
    const content = escapeHTML(text);

    if (href) {
      return `<a href="${href}" class="${classString} underline text-blue-600 hover:text-blue-800" target="_blank">${content}</a>`;
    } else {
      return `<span class="${classString}">${content}</span>`;
    }
  }).join("");
}

function mapTextColor(color) {
  const map = {
    gray: "text-gray-600",
    brown: "text-yellow-900",
    orange: "text-orange-600",
    yellow: "text-yellow-500",
    green: "text-green-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    pink: "text-pink-600",
    red: "text-red-600",
    default: ""
  };
  return map[color] || "";
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
