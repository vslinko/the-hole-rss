import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "node:fs";
import express from "express";

const months = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

const app = express();

app.get("/", async (req, res) => {
  try {
    const rss = await makeRSS();
    res.setHeader('content-type', 'text/xml');
    res.send(rss);
  } catch (err) {
    res.status(500).send();
  }
});

app.listen(3000, '0.0.0.0');

async function makeRSS() {
  if (!fs.existsSync("cache")) {
    fs.mkdirSync("cache");
  }

  const rss = {
    title: "The Hole",
    link: "https://the-hole.tv/",
    language: "ru-ru",
    pubDate: null,
    description: `Новинки The Hole`,
    items: [],
  };

  const $recent = cheerio.load(
    await (await fetch("https://the-hole.tv/episodes/recent")).text()
  );

  for (const x of $recent("#episodes_recent .episode_small")) {
    const $a = $recent(x).find("a");
    const episodeUrl = `https://the-hole.tv${$a.attr("href")}`;

    let episodeJson;
    const episodeJsonCacheFile = `cache/${encodeURIComponent(episodeUrl)}.json`;
    if (fs.existsSync(episodeJsonCacheFile)) {
      episodeJson = JSON.parse(fs.readFileSync(episodeJsonCacheFile));
    } else {
      const episodeHtmlCacheFile = `cache/${encodeURIComponent(
        episodeUrl
      )}.html`;
      let episodeHtml;
      if (fs.existsSync(episodeHtmlCacheFile)) {
        episodeHtml = fs.readFileSync(episodeHtmlCacheFile, "utf-8");
      } else {
        episodeHtml = await (await fetch(episodeUrl)).text();
        fs.writeFileSync(episodeHtmlCacheFile, episodeHtml);
      }
      const $episode = cheerio.load(episodeHtml);
      const showTitle = $episode('a[href^="/shows/"].text-white').text().trim();
      const episodeTitle = $episode(".player-about .text-3xl").text().trim();
      // const dateMatch = new RegExp(`(\\d+) (${months.join('|')}) (\\d+)`, 'g').exec($episode('.player-about .text-3xl').next().text());
      const date = new Date();
      const about = $episode(".about")
        .text()
        .replace("\nдалее\n", "")
        .trim()
        .replace(/\n/g, "<br>");
      const img = $episode("[data-player-poster-value]").attr(
        "data-player-poster-value"
      );
      episodeJson = {
        link: episodeUrl,
        guid: episodeUrl,
        pubDate: date.toGMTString(),
        description: `<img src="${img}"><br>${about}`,
        title: `${showTitle} - ${episodeTitle}`,
        author: showTitle,
      };
      fs.writeFileSync(episodeJsonCacheFile, JSON.stringify(episodeJson));
    }
    rss.items.push(episodeJson);
  }
  rss.pubDate = rss.items[0].pubDate;

  return `<rss xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:slash="http://purl.org/rss/1.0/modules/slash/" version="2.0">
  <channel>
    <title><![CDATA[ ${rss.title} ]]></title>
    <link>${rss.link}</link>
    <language>${rss.language}</language>
    <pubDate>${rss.pubDate}</pubDate>
    <description><![CDATA[ ${rss.description} ]]></description>
${rss.items
  .map(
    (item) => `    <item>
      <link>${item.link}</link>
      <guid>${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description><![CDATA[ ${item.description} ]]></description>
      <title><![CDATA[ ${item.title} ]]></title>
      <author>${item.author}</author>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>
`;
}
