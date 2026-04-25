const http = require("http");

const data = JSON.stringify({
  charityId: "1",
  amount: 500,
  donor: {
    name: "Vaibhav Patil",
    email: "vaibhav7315patil@gmail.com",
    anonymous: false,
  },
  paymentMethod: "stripe",
  message: "",
});

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/donations",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = "";
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    console.log("BODY:", body);
  });
});

req.on("error", (e) => {
  console.error("problem with request:", e);
});
req.setTimeout(5000, () => {
  console.error("Request timed out");
  req.abort();
});

req.write(data);
req.end();
