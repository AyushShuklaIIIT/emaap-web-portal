import { createServer } from "./app.ts";

const PORT = process.env.PORT || 8008;
const { httpServer } = createServer();

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});