// export async function GET() {
//     const res = await fetch("http://localhost:11434/api/tags");
//     const data = await res.json();
//
//     return Response.json(data.models);
// }

import ollama from "ollama";

export async function GET() {
  const res = await ollama.list();

  return Response.json(res.models);
}
