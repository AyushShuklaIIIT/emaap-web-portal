import { createServer } from "./app.ts";

const PORT = process.env.PORT || 8008;
const { httpServer } = createServer();

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});