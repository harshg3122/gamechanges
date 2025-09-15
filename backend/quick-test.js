const http = require("http");

function testAPI() {
  const options = {
    hostname: "localhost",
    port: 3001,
    path: "/health",
    method: "GET",
  };

  const req = http.request(options, (res) => {
    console.log("Status:", res.statusCode);
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log("Response:", data);
    });
  });

  req.on("error", (e) => {
    console.log("Error:", e.message);
  });

  req.end();
}

testAPI();
