const response = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models?pageSize=100",
  {
    headers: {
      "x-goog-api-key": process.env.AI_API_KEY,
    },
  }
);

if (!response.ok) {
  console.error(response.status, await response.text());
  process.exit(1);
}

const data = await response.json();

for (const model of data.models) {
  if (model.supportedGenerationMethods?.includes("generateContent")) {
    console.log(model.name.replace("models/", ""));
  }
}