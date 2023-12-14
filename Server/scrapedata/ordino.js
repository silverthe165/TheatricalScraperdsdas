const axios = require("axios");
const cheerio = require("cheerio");

const delayBetweenRequests = 3600000 / 1000; // 3600000ms = 1 hour, dividing by 1000 to get seconds
const maxActorsPerHour = 1000;
let actorsScrapedThisHour = 0;
let lastScrapeTimestamp = null;
const scrapedData = [];

async function scrapeDataFromURL(actorId) {
  const URL = `https://www.ordino.gr/en_actor_detail.asp?id=${actorId}`;

  try {
    const response = await axios.get(URL);
    const html = response.data;
    const details = scrapeData(html);
    scrapedData.push(details);
    if(details.fullname!=="" || details.role!=="" ){    postScrapedDataToServer(details)
    }
  } catch (error) {
    // console.error(`Error while scraping actor ID ${actorId}:`, error.message);
  }
}

async function postScrapedDataToServer(data) {
  const serverURL =
    "https://theatricalapi.jollybay-0ad0b06b.germanywestcentral.azurecontainerapps.io/api/People";
  const authToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNpbHZlcnRoZTE2NUBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJuYmYiOjE2OTg4NTY4NTksImV4cCI6MTY5ODg2MDQ1OSwiaWF0IjoxNjk4ODU2ODU5LCJpc3MiOiJUaGVhdHJpY2FsUG9ydGFsU2VydmljZSIsImF1ZCI6IlRoZWF0cmljYWxQb3J0YWxTZXJ2aWNlIn0.8DitMyJgBm8TXYEMp5h4J5abpreLrCPJapzKGl0FPbQ";

  const headers = {
    Authorization: `Bearer ${authToken}`,
    "Content-Type": "application/json",
  };
  try {
    const response = await axios.post(serverURL, data, { headers });

    console.log("Data posted to server:", response.data);
  } catch (error) {
    console.error("Error while posting data to server:", error.message);
  }
}

async function scrapeDataForActorRange(startActorId, endActorId) {

  for (
    let currentActorId = startActorId;
    currentActorId <= endActorId;
    currentActorId++
  ) {
    if (actorsScrapedThisHour >= maxActorsPerHour) {
      const currentTime = Date.now();
      const timeElapsedSinceLastScrape = currentTime - lastScrapeTimestamp;

      if (timeElapsedSinceLastScrape < delayBetweenRequests) {
        const delay = delayBetweenRequests - timeElapsedSinceLastScrape;
        console.log(
          `Hourly limit reached. Waiting for ${
            delay / 1000
          } seconds before resuming.`
        );
        await sleep(delay);
      }

      actorsScrapedThisHour = 0;
      lastScrapeTimestamp = null;
    }

    await scrapeDataFromURL(currentActorId);

    actorsScrapedThisHour++;
    if (!lastScrapeTimestamp) {
      lastScrapeTimestamp = Date.now();
    }
  }
}

function scrapeData(html) {
  const details = {
    role: "",
    fullname: "",
    age: "",
    eyeColor: "",
    weight: "",
    languages: [],
    hairColor: "",
    height: "",
    description: "",
    bio: "",
    birthdate: "",
    images: [],
    roles: [],
    system: 15,
  };

  const $ = cheerio.load(html);

  const actorname = $(".bodytitle1 > .bodytitle1 > .bodytitle1").text();

  const firstTdBodyMain = $("td.bodymain").first();
  const bElementsInFirstTd = firstTdBodyMain.find("b");

  const firstRole = firstTdBodyMain.find("b:first-child").text().trim();

  const roles = bElementsInFirstTd
    .map((index, element) => $(element).text().trim())
    .get();

  const spansAfterLanguages = $('span.bodymain:contains("Languages")').nextAll(
    "span.bodymain"
  );

  spansAfterLanguages.each((index, element) => {
    const textContent = $(element).text().trim();
    details.languages.push(textContent);
  });

  details.fullname = actorname;
  details.role = firstRole;
  details.roles = roles;

  const extractedData = {};

  $("td.bodymain").each((index, element) => {
    const text = $(element).text().trim();
    const [key, value] = text.split(":");

    if (key && value) {
      if (key == "Hair color") {
        details.hairColor = value;
      } else if (key == "Eye color") {
        details.eyeColor = value;
      } else if (key == "Height") {
        details.height = value;
      } else if (key == "Weight") {
        details.weight = value;
      } else {
        extractedData[key.trim()] = value.trim();
      }
    }
  });

  return details;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Usage: Scrape data for actors with IDs from 10551 to 11550

module.exports = {
  scrapeDataFromURL,
  scrapeData,
  scrapeDataForActorRange,
  scrapedData,
  postScrapedDataToServer,
};
