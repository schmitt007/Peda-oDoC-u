import { createServer } from "node:http";
import { appendFile, mkdir, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const dataDirectory = resolve(root, "data");
const inquiryFile = resolve(dataDirectory, "orcamentos.jsonl");
const port = Number(process.env.PORT || 3000);
const maximumBodySize = 16 * 1024;

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"]
]);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(payload));
}

async function receiveJson(request) {
  let body = "";
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maximumBodySize) {
      throw Object.assign(new Error("O pedido excede o tamanho permitido."), { statusCode: 413 });
    }
    body += chunk;
  }

  try {
    return JSON.parse(body);
  } catch {
    throw Object.assign(new Error("O formato do pedido é inválido."), { statusCode: 400 });
  }
}

function validateInquiry(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Os dados enviados são inválidos.";
  }

  const fields = ["name", "contact", "eventType", "eventDate", "message"];
  if (fields.some((field) => typeof payload[field] !== "string")) {
    return "Confira os campos do formulário e tente novamente.";
  }

  const inquiry = {
    name: payload.name.trim(),
    contact: payload.contact.trim(),
    eventType: payload.eventType.trim(),
    eventDate: payload.eventDate.trim(),
    message: payload.message.trim()
  };

  if (!inquiry.name || inquiry.name.length > 80) return "Informe um nome de até 80 caracteres.";
  if (!inquiry.contact || inquiry.contact.length > 30) return "Informe um telefone válido de até 30 caracteres.";
  if (!inquiry.eventType || inquiry.eventType.length > 100) return "Selecione o tipo de pedido.";
  if (inquiry.eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(inquiry.eventDate)) return "A data informada é inválida.";
  if (inquiry.message.length > 1200) return "A mensagem deve ter até 1.200 caracteres.";

  return inquiry;
}

async function handleInquiry(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Método não permitido." });
    return;
  }

  if (!request.headers["content-type"]?.includes("application/json")) {
    sendJson(response, 415, { error: "O pedido deve ser enviado em formato JSON." });
    return;
  }

  let payload;
  try {
    payload = await receiveJson(request);
  } catch (error) {
    sendJson(response, error.statusCode || 400, { error: error.message });
    return;
  }

  const inquiry = validateInquiry(payload);
  if (typeof inquiry === "string") {
    sendJson(response, 400, { error: inquiry });
    return;
  }

  try {
    await mkdir(dataDirectory, { recursive: true });
    await appendFile(inquiryFile, `${JSON.stringify({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...inquiry
    })}\n`, { encoding: "utf8", flag: "a" });
  } catch (error) {
    console.error("Não foi possível salvar o orçamento:", error);
    sendJson(response, 500, { error: "Não foi possível registrar o pedido agora." });
    return;
  }

  sendJson(response, 201, { message: "Pedido registrado com sucesso." });
}

async function serveStatic(pathname, response) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    response.writeHead(400).end("Endereço inválido.");
    return;
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const filePath = resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Acesso negado.");
    return;
  }
  const privateDirectory = process.platform === "win32"
    ? dataDirectory.toLowerCase()
    : dataDirectory;
  const requestedPath = process.platform === "win32"
    ? filePath.toLowerCase()
    : filePath;
  if (requestedPath === privateDirectory || requestedPath.startsWith(`${privateDirectory}${sep}`)) {
    response.writeHead(404).end("Não encontrado.");
    return;
  }

  try {
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) {
      response.writeHead(404).end("Não encontrado.");
      return;
    }
    response.writeHead(200, {
      "Content-Type": contentTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream",
      "Content-Length": fileInfo.size,
      "X-Content-Type-Options": "nosniff"
    });
    if (response.req.method === "HEAD") {
      response.end();
    } else {
      createReadStream(filePath).pipe(response);
    }
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      response.writeHead(404).end("Não encontrado.");
      return;
    }
    console.error("Não foi possível servir o arquivo:", error);
    response.writeHead(500).end("Erro ao carregar o arquivo.");
  }
}

createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;

  if (pathname === "/api/orcamentos") {
    handleInquiry(request, response).catch((error) => {
      console.error("Erro inesperado ao registrar orçamento:", error);
      if (!response.headersSent) sendJson(response, 500, { error: "Ocorreu um erro inesperado." });
    });
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Método não permitido.");
    return;
  }

  serveStatic(pathname, response).catch((error) => {
    console.error("Erro inesperado ao carregar a página:", error);
    if (!response.headersSent) response.writeHead(500).end("Erro ao carregar a página.");
  });
}).listen(port, () => {
  console.log(`Pedaço do Céu disponível em http://localhost:${port}`);
});
