/* CHANGE ALL OF THESE BASED ON THE CLOUDFORMATION OUTPUT */
const APIBaseURL =
  "https://1w7f57jh5d.execute-api.us-east-1.amazonaws.com/prod/streams/";
const hotspotStream = "deleteme2-HotSpotStream-DO7K55940CZ0";
const clickStream = "deleteme2-ClickStream-13F0KD49I1136";

// Don't change these
const clickstreamURL = new URL(APIBaseURL + clickStream + "/record");
const hostpotIteratorURL = new URL(
  APIBaseURL + hotspotStream + "/sharditerator"
);
const hotspotRecordsURL = new URL(APIBaseURL + hotspotStream + "/record");
const hotspotURL = new URL(APIBaseURL + hotspotStream + "/");

var shards = new Map();

async function getShards() {
  const response = await fetch(hotspotURL);
  const json = await response.json();
  /* this could be promises.all if I rewrote it but I suck at javascript */
  json.StreamDescription.Shards.forEach(async element => {
    shards.set(element.ShardId, await getShardIterator(element.ShardId));
  });
}

async function getShardIterator(shard) {
  const response = await fetch(
    hostpotIteratorURL + "?shard-id=" + encodeURIComponent(shard)
  );
  const json = await response.json();
  return json.ShardIterator;
}

async function getHotspots(iterator) {
  const response = await fetch(hotspotRecordsURL, {
    headers: new Headers({ "Shard-Iterator": iterator })
  });
  const json = await response.json();
  return json;
}

async function paintHotspots(hotspots) {
  hotspots.forEach(hotspot => {
    context.beginPath();
    if (hotspot.density != "Infinity") {
      context.lineWidth = hotspot.density * 100;
    } else {
      context.lineWidth = 10;
    }
    context.strokeStyle = "red";
    context.rect(
      hotspot.minValues[0],
      hotspot.minValues[1],
      hotspot.maxValues[0] - hotspot.minValues[0],
      hotspot.maxValues[1] - hotspot.minValues[1]
    );
    context.stroke();
  });
}

async function recordClickEvent(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(event.clientX - rect.left);
  const y = Math.floor(event.clientY - rect.top);
  console.log(x, y);
  const response = await fetch(clickstreamURL, {
    headers: new Headers({ "Content-Type": "application/json" }),
    method: "PUT",
    body: JSON.stringify({ x: x, y: y })
  });
}

const canvas = document.querySelector("#app-canvas");

/* JAVASCRIPT IS FUCKING CRAZY */
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

const context = canvas.getContext("2d");

/* every time someone clicks, shoot the x,y coords over to kinesis */
canvas.addEventListener("click", async event => {
  event.preventDefault();
  await recordClickEvent(canvas, event);
});

/* start by building a map of shards and shard iterators */
const start = async () => {
  await getShards();
};
start();

/* every 5 minutes grab new shard iterators */
setInterval(async () => {
  await getShards();
}, 300000);

/* every 4 seconds or so:
1. Grab all the shard iterators
2. Fetch new records from them
3. parse the resulting base64 encoded records into JSON and then each row into JSON
4. throw it over to our paint job to make little rectangles
*/
setInterval(async () => {
  shards.forEach(async (value, key, map) => {
    const hotspotsData = await getHotspots(value);
    hotspotsData.Records.forEach(async record => {
      const hotspots = JSON.parse(JSON.parse(atob(record.Data)).HOTSPOTS_RESULT)
        .hotspots;
      console.log(hotspots);
      await paintHotspots(hotspots);
    });
  });
}, 4000);
