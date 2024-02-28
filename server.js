const request = require("request");
const express = require("express");
const { default: axios } = require("axios");
const app = express();
require('dotenv').config();

app.use(express.json());
let phoneNumber;
// POST /aircall/calls
app.post("/aircall/calls", async (req, res) => {
  if (req.body.event === "call.created") {
    phoneNumber = req.body.data.raw_digits;

    const callId = req.body.data.id;
    const cardContent = getInsightCardContent();

    const payload = await createInsightCardPayload(cardContent);

    try {
      sendInsightCard(callId, payload);
    } catch (error) {
      // Handle the error if the axios request fails
      console.error("Error in axios request:", error);
    }
  } else {
    console.log("Event non-handled:", req.body.event);
  }

  res.sendStatus(200);
});

app.get("/aircall/calls", (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello, this server is running on GoDaddy!");
  //   console.log("working");
});

const sendInsightCard = (callId, payload) => {
  const API_ID = process.env.API_ID;
  const API_TOKEN = process.env.API_TOKEN;

  const uri = `https://${API_ID}:${API_TOKEN}@api.aircall.io/v1/calls/${callId}/insight_cards`;

  request.post(uri, { json: payload }, (error, response, body) => {
    if (!!error) {
      console.error("Error while sending insight card:", error);
    } else {
      console.log("HTTP status code:", response && response.statusCode);
      console.log("HTTP body:", body);
    }
  });
};

const getInsightCardContent = () => {
  let lines = [];

  // Write your business logic here to populate the lines of the card
  lines.push("Dean Titlow");
  // lines.push('+61 283109201');
  // lines.push('last notes');
  return lines;
};

const createInsightCardPayload = async (lines) => {
  let payload = {
    contents: [],
  };
  const API_URL = `https://voipy.businessictsydney.com.au/aircall-luke/candidate/${phoneNumber}`;
  try {
    const { data } = await axios.get(API_URL);
    // console.log(data);
    const { name = "N/A", mobile = "N/A", notes = "N/A", viewUrl  } = data;
    payload.contents.push(
      {
        type: "title",
        text: "View Detials",
        link: viewUrl || "N/A",
      },
      {
        type: "shortText",
        text: name || "N/A",
        label: "Company Name",
      },
      {
        type: "shortText",
        text: mobile || "N/A",
        label: "Phone No.",
      },
      {
        type: "shortText",
        text: notes || "N/A",
        label: "Last Note",
      }
    );
  } catch {
    payload.contents.push(
      {
        type: "title",
        text: "Details Not found",
      },
    );
  }
  
  return payload;
};

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});