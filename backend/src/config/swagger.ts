import YAML from "yamljs";
import { join } from "path";
import { readFileSync } from "fs";

// Load the root OpenAPI YAML which uses $ref to include paths and components
const specPath = join(process.cwd(), "src", "docs", "openapi.yaml");
const swaggerDocument: any = YAML.parse(readFileSync(specPath, "utf8"));

// Resolve simple top-level $ref in paths and components.schemas
function tryResolveRef(refStr: string) {
  // refStr may be './components/schemas/auth.yaml#/LoginRequest' or '#/components/schemas/LoginRequest'
  const [filePart = "", pointer] = refStr.split("#");
  
  // If there's no file part (local ref starting with '#'), resolve against the already-loaded swaggerDocument
  if (!filePart) {
    if (!pointer || pointer === "#") return swaggerDocument;
    const p = pointer.replace(/^#?/, "");
    const parts = p.split("/").filter(Boolean).map((s: string) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
    let cur: any = swaggerDocument;
    for (const part of parts) {
      if (cur === undefined) return undefined;
      cur = cur[part];
    }
    return cur;
  }

  // Otherwise load external file relative to docs folder
  const filePath = join(process.cwd(), "src", "docs", filePart);
  try {
    const doc: any = YAML.parse(readFileSync(filePath, "utf8"));
    if (!pointer || pointer === "#") return doc;
    const p = pointer.replace(/^#?/, "");
    const parts = p.split("/").filter(Boolean).map((s: string) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
    let cur: any = doc;
    for (const part of parts) {
      cur = cur[part];
      if (cur === undefined) return undefined;
    }
    return cur;
  } catch (err: any) {
    console.error("Failed to load ref file", filePath, err);
    return undefined;
  }
}

// Recursively resolve any $ref properties found inside an object
function resolveRefsRec(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(resolveRefsRec);
  if (typeof obj !== "object") return obj;

  // If this object itself is a $ref node, try to resolve and return the resolved value
  if (obj.$ref && typeof obj.$ref === "string") {
    const resolved = tryResolveRef(obj.$ref);
    // If resolved is an object, make sure to recursively resolve inside it too
    if (resolved && typeof resolved === "object") {
      return resolveRefsRec(JSON.parse(JSON.stringify(resolved)));
    }
    return resolved;
  }

  // Otherwise walk properties
  for (const [k, v] of Object.entries(obj)) {
    (obj as any)[k] = resolveRefsRec(v as any);
  }
  return obj;
}

// First, resolve any top-level path $ref entries which point to external files
if (swaggerDocument && swaggerDocument.paths) {
  for (const [p, v] of Object.entries(swaggerDocument.paths)) {
    if (v && typeof v === "object" && (v as any).$ref) {
      const resolved = tryResolveRef((v as any).$ref);
      if (resolved) swaggerDocument.paths[p] = resolved;
    }
  }
}

// Resolve component schema $refs (external files or internal)
if (swaggerDocument && swaggerDocument.components && swaggerDocument.components.schemas) {
  for (const [name, val] of Object.entries(swaggerDocument.components.schemas)) {
    if (val && typeof val === "object" && (val as any).$ref) {
      const resolved = tryResolveRef((val as any).$ref);
      if (resolved) swaggerDocument.components.schemas[name] = resolved;
    }
  }
}

// Resolve securitySchemes $refs
if (swaggerDocument && swaggerDocument.components && swaggerDocument.components.securitySchemes) {
  for (const [name, val] of Object.entries(swaggerDocument.components.securitySchemes)) {
    if (val && typeof val === "object" && (val as any).$ref) {
      const resolved = tryResolveRef((val as any).$ref);
      if (resolved) swaggerDocument.components.securitySchemes[name] = resolved;
    }
  }
}

// Replace server URLs with environment variable if set
if (swaggerDocument.servers && Array.isArray(swaggerDocument.servers)) {
  const apiUrl = process.env.API_URL || "http://localhost:5000";
  swaggerDocument.servers.forEach((server: any) => {
    if (server.url && typeof server.url === "string") {
      // Update first server (development) with API_URL if set
      if (swaggerDocument.servers.indexOf(server) === 0) {
        server.url = apiUrl;
      }
    }
  });
}

// Finally, recursively walk the full document and resolve any remaining $ref nodes
resolveRefsRec(swaggerDocument);

export default swaggerDocument;
