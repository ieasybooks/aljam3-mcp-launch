"""Collect the real aljam3.com/mcp responses shown in the film into src/data/demo.json.
The snapshots in data/ are raw JSON-RPC responses (tools/list and tools/call) from the live server."""
import json, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
D = ROOT / "data"
def result(n): return json.loads((D / n).read_text())["result"]
def content(n): return result(n)["structuredContent"]
def oneline(s): return re.sub(r"\s+", " ", s).strip()

tools = [t["name"] for t in result("tools.json")["tools"]]
books = content("list_books.json")["books"]
hit = content("search.json")["results"][0]
page = content("get_page_29.json")
text = page["text"]["content"]
start = text.index("١/١")
hadith = oneline(text[start:text.index("رَوَاهُ إِمَاما")])
book = page["page"]["book"]

data = {
  "question": "أين ورد حديث «إنما الأعمال بالنيات» في رياض الصالحين؟ اذكر الباب ورقم الصفحة.",
  "tools": tools,
  "libraries": [l["name"] for l in content("list_libraries.json")["libraries"]],
  "books": [{"id": b["id"], "title": b["title"], "author": b["author"]["name"], "pages": b["pages_count"]} for b in books[:3]],
  "booksCount": len(books),
  "hit": {"fileId": hit["file_id"], "page": hit["page_number"], "fileName": hit["file_name"], "url": hit["url"],
          "excerpt": oneline(hit["excerpt"][hit["excerpt"].index("قَالَ: سَمِعْتُ"):hit["excerpt"].index("فَمَنْ كَانَتْ")])},
  "page": {
    "fileId": page["page"]["file_id"], "number": page["page"]["page_number"], "url": page["page"]["url"],
    "chapter": oneline(text[text.index("باب"):text.index("قَالَ اللَّهُ")]),
    "hadith": hadith,
    "totalChars": page["text"]["total_chars"],
    "previous": page["navigation"]["previous_page_number"], "next": page["navigation"]["next_page_number"],
  },
  "book": {"id": book["id"], "title": book["title"], "author": book["author"]["name"], "category": book["category"]["name"],
           "library": book["library"]["name"], "pages": book["pages_count"]},
}
(ROOT / "src/data/demo.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))
print(json.dumps(data, ensure_ascii=False, indent=1))
