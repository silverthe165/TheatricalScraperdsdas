const express = require("express");
const bodyParser = require("body-parser");
const fakeData = {
  fullname: "Name",
  hairColor: "Black",
  height: "180 cm",
  eyeColor: "green",
  weight: "80 kg",
  languages: ["English", "greek"],
  description: "string",
  bio: "this is the bio",
  birthdate: "20-02-2000",
  system: 14,
};
const {
  scrapeDataFromURL,
  scrapeData,
  scrapedData,
  postScrapedDataToServer,
  scrapeDataForActorRange,
} = require("./scrapedata/ordino"); // Import the scraping functions from the scraper file
const cors = require("cors");

const app = express();

app.use(bodyParser.json());
app.use(cors());

let scrapingInProgress = false; // Global variable to track scraping status

// scrapeDataForActorRange(19897, 22000);

app.post("/startScraping", async (req, res) => {


  const { startActorId, endActorId } = req.body;

  if (!startActorId || !endActorId) {
    res
      .status(400)
      .json({ error: "Invalid request. Provide startActorId and endActorId." });
    return;
  }

  if (scrapingInProgress) {
    res.status(400).json({ error: "Scraping is already in progress." });
    return;
  }

  scrapingInProgress = true; // Set scraping in progress
console.log(startActorId, endActorId)
  try {
    const test=await scrapeDataForActorRange(startActorId, endActorId);

    scrapingInProgress = false; // Reset scraping status when done
console.log( test)

    postScrapedDataToServer(fakeData);
    // Send the scraped data as a response
    res.json({ message: "Scraping completed successfully!", scrapedData });
  } catch (error) {
    console.error("Error while scraping:", error);
    scrapingInProgress = false; // Reset scraping status on error
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/stopScraping", (req, res) => {
  scrapingInProgress = false;

  res.json({ message: "Scraping stopped." });
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
