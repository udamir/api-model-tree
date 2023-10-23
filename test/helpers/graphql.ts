import path from "path"
import fs from "fs"

import { GraphApiSchema, buildFromSchema } from "gqlapi"
import { buildSchema } from "graphql"

export const buildGraphApiSchema = (filename: string): GraphApiSchema => {
  const resPath = path.join(__dirname, "../resources/", filename)
  const raw = fs.readFileSync(resPath, "utf8")
  const schema = buildSchema(raw, { noLocation: true })
  return buildFromSchema(schema)
}
