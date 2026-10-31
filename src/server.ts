import { createServer } from "node:http";
import app from "./app.js";

const PORT = 3000;

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Nexus API server listening on port ${PORT}`);
});
