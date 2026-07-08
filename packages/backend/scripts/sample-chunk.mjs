// Debug helper: decode serde-framed devalue chunks from a session stream.
import { ConvexHttpClient } from "convex/browser";

const url = process.env.CONVEX_URL ?? "http://127.0.0.1:3210";
const secret = process.env.WORLD_SERVICE_SECRET ?? "dev-world-secret";
const client = new ConvexHttpClient(url);

const runs = await client.query("ui:listRuns", { limit: 100 });
const withStreams = [];
for (const run of runs) {
  const streams = await client.query("ui:listRunStreams", {
    runId: run.runId,
  });
  if (streams.length > 0) {
    withStreams.push({ run, streams });
  }
}
for (const { run, streams } of withStreams.slice(0, 5)) {
  console.log(
    run.runId,
    run.workflowName,
    streams.map((s) => `${s.name}(${s.dataCount}${s.done ? ",done" : ""})`),
  );
}
const target = withStreams[0];
if (!target) {
  console.log("no streams anywhere");
  process.exit(0);
}
const name =
  target.streams.find((s) => s.name.endsWith("user"))?.name ??
  target.streams[0].name;
const page = await client.query("world/streams:getChunksPage", {
  secret,
  runId: target.run.runId,
  name,
  startSeq: 0,
  limit: 10,
});
console.log(`\nstream ${name}: ${page.dataCount} chunks, done=${page.done}`);

for (const { seq, data } of page.chunks.slice(0, 8)) {
  const bytes = new Uint8Array(data);
  const magic = new TextDecoder().decode(bytes.subarray(0, 4));
  const body = new TextDecoder().decode(bytes.subarray(4));
  console.log(`--- seq ${seq} magic=${magic} len=${bytes.length}`);
  console.log(body.slice(0, 400));
}
