export default async function handler(req, res) {
  const { pageId } = req.query;
  const notionToken = process.env.NOTION_TOKEN;

  if (!pageId || !notionToken) {
    return res.status(400).json({ error: "缺少 pageId 或 token" });
  }

  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  try {
    // 取得 block 內容
    const blocksRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, { headers });
    const blocksData = await blocksRes.json();

    // 取得頁面標題（從 page metadata）
    const pageRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { headers });
    const pageData = await pageRes.json();

    let title = "Untitled";
    const prop = pageData.properties?.title;
    if (prop?.title?.[0]?.plain_text) {
      title = prop.title[0].plain_text;
    }

    res.status(200).json({
      title,
      blocks: blocksData.results || []
    });

  } catch (err) {
    console.error("❌ Notion API error:", err);
    res.status(500).json({ error: "Notion API error" });
  }
}
