const { createServer } = require("http");
const next = require("next");
const os = require("os");
const interfaces = os.networkInterfaces();

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(80, (err) => {
    if (err) throw err;

    const getLocalIpAddress = () => {
      for (const interfaceName of Object.keys(interfaces)) {
        for (const iface of interfaces[interfaceName]) {
          if (iface.family === "IPv4" && !iface.internal) {
            return iface.address;
          }
        }
      }
      return "0.0.0.0";
    };

    const ipAddress = getLocalIpAddress();
    console.log(`Server is running on http://${ipAddress}`);
  });
});
