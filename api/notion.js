export default async function handler(req, res) {
  const { pageId } = req.query;
  const notionToken = process.env.NOTION_TOKEN;

  if (!pageId || !notionToken) {
    return res.status(400).json({ error: "缺少 pageId 或 token" });
  }

  const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  res.status(200).json(data);
}
