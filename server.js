require("dotenv").config();
const dns = require("dns");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

const db = require("./db");
const ShortURL = require("./models/ShortURL");

// Basic Configuration
const port = process.env.PORT || 3000;

/**
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
const checkDNS = (url) => {
  return new Promise((resolve, reject) => {
    dns.lookup(url, async (err, addr) => {
      if (err) reject(err);
      resolve(addr);
    });
  });
};

const run = async () => {
  app.use(bodyParser.urlencoded({ extended: false }));

  app.use(cors());

  await db.connectToDB();

  app.use("/public", express.static(`${process.cwd()}/public`));

  app.get("/", function (req, res) {
    res.sendFile(process.cwd() + "/views/index.html");
  });

  // Your first API endpoint
  app.get("/api/hello", function (req, res) {
    res.json({ greeting: "hello API" });
  });

  app.post("/api/shorturl", async (req, res) => {
    try {
      console.log(JSON.stringify(req.body, 0, 2));
      const url = req.body.url;
      if (!url) throw new Error("Missing URL");

      const sanitizedUrlArr = url.match(
        /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/
      );
      if (!sanitizedUrlArr || !sanitizedUrlArr.length)
        throw new Error("Missing URL");

      const sanitizedUrl = sanitizedUrlArr[0];

      const urlObject = new URL(sanitizedUrl);
      await checkDNS(urlObject.origin.replace(/^https?:\/\//i, ""));

      const urlRecord = await new ShortURL({ url: sanitizedUrl }).save();

      res.json({
        original_url: urlRecord.url,
        short_url: urlRecord.short_url,
      });
    } catch (err) {
      console.error(err);
      res.json({ error: "invalid url" });
    }
  });

  app.get("/api/shorturl/:short_url", async (req, res) => {
    try {
      const urlPos = Number(req.params.short_url);
      if (!urlPos) throw new Error("Invalid short_url id");
      const urlObj = await ShortURL.findOne({ short_url: urlPos })
        .lean()
        .exec();
      if (!urlObj) throw new Error("URL not found");
      if (urlObj.url) res.status(301).redirect(urlObj.url);
    } catch (err) {
      console.error(err);
      return res.json({});
    }
  });

  app.listen(port, function () {
    console.log(`Listening on port ${port}`);
  });
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
