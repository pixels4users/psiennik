/** Isolated, in-memory UI fixtures. Never connects to a real Supabase project. */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const apiPort = 4174;
const appPort = 4175;
const root = new URL("../", import.meta.url);
const now = new Date().toISOString();
const today = now.slice(0, 10);
const ownerId = "11111111-1111-4111-8111-111111111111";
const expertId = "22222222-2222-4222-8222-222222222222";
const ids = Array.from({ length: 8 }, (_, i) => `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa${i + 1}`);
const names = ["Humus", "Lunka", "Luna", "Figa", "Borys", "Milo", "Koko", "Rufus"];
const profiles = [
  {
    id: ownerId,
    display_name: "Opiekun",
    email: "owner@ui.psiennik.test",
    terms_version: "2026-09-14",
    max_active_dogs: 10,
  },
  {
    id: expertId,
    display_name: "Anna",
    email: "behaviorist@ui.psiennik.test",
    terms_version: "2026-09-14",
    max_active_dogs: 10,
  },
];
const tables = {
  profiles,
  dogs: names.map((name, i) => ({
    id: ids[i],
    name,
    owner_id: ownerId,
    age: i === 0 ? "3 lata" : "2 lata",
    breed: i === 0 ? "Golden retriever" : "Mieszaniec",
    sex: i % 2 ? "suczka" : "pies",
    photo_url: i < 4 ? `photo${i + 1}` : null,
    created_at: now,
  })),
  dog_access: ids.flatMap((id, i) => [
    {
      id: `expert-${id}`,
      dog_id: id,
      user_id: expertId,
      role: "behaviorist",
      process_status: i === 6 ? "pending" : i === 7 ? "completed" : "active",
      created_at: now,
    },
    {
      id: `owner-${id}`,
      dog_id: id,
      user_id: ownerId,
      role: "owner",
      process_status: "active",
      created_at: now,
    },
  ]),
  entries: ids.flatMap((dog_id, i) =>
    Array.from({ length: i === 1 ? 0 : 3 }, (_, j) => ({
      id: `bbbbbbbb-bbbb-4bbb-8bbb-${String(i * 3 + j + 1).padStart(12, "0")}`,
      dog_id,
      created_by: ownerId,
      title: ["Spokojny spacer w parku", "Ćwiczymy zostawanie", "Odpoczynek po wizycie gości"][j],
      description: [
        "Minęliśmy dwa psy bez szczekania. Pomogło zwiększenie dystansu i spokojna komenda.",
        "Trzy krótkie serie po dwie minuty. Po przerwie łatwiej wrócił na swoje miejsce.",
        "Samodzielnie wybrał legowisko. Potrzebował chwili, żeby się wyciszyć.",
      ][j],
      rating: ["green", "amber", "green"][j],
      date: today,
      time_of_day: ["rano", "poludnie", "wieczor"][j],
      times_of_day: [["rano"], ["poludnie"], ["wieczor"]][j],
      activity_type: ["spacer", "trening", "wypoczynek"][j],
      activity_types: [["spacer"], ["trening"], ["wypoczynek"]][j],
      behaviorist_comment:
        j === 0 ? "Zostańcie przy tym dystansie. Zwróć uwagę, jak szybko wraca do spokoju." : null,
      created_at: now,
      updated_at: now,
      commented_at: j === 0 ? now : null,
    })),
  ),
  entry_comments: [
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      entry_id: "bbbbbbbb-bbbb-4bbb-8bbb-000000000001",
      author_id: expertId,
      author_role: "behaviorist",
      body: "Jak długo trwał dzisiejszy spacer?",
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  ],
  dog_views: [],
  dog_invites: [
    { id: "invite-owner", code: "PIES01", dog_id: ids[2], role: "owner", used_at: null },
    {
      id: "invite-behaviorist",
      code: "PIES02",
      dog_id: ids[2],
      role: "behaviorist",
      used_at: null,
    },
  ],
  owner_behaviorists: [],
  behaviorist_links: [
    { id: "link-anna", behaviorist_id: expertId, invite_code: "BEH-ANNA", is_active: true },
  ],
};
const sessions = new Map();
const createdDogs = new Map();
// Optional snapshot preserves edits when restarting a running local review.
// This file contains only the synthetic data served by this script.
if (process.env.PSIENNIK_UI_REVIEW_SNAPSHOT) {
  const snapshot = JSON.parse(readFileSync(process.env.PSIENNIK_UI_REVIEW_SNAPSHOT, "utf8"));
  for (const [table, rows] of Object.entries(snapshot.tables ?? {})) {
    if (!(table in tables)) continue;
    const combined = new Map(tables[table].map((row) => [row.id ?? row.behaviorist_id, row]));
    for (const row of rows) combined.set(row.id ?? row.behaviorist_id, row);
    tables[table] = [...combined.values()];
  }
  for (const [scenario, dogIds] of snapshot.createdDogs ?? []) createdDogs.set(scenario, dogIds);
}
function filterRows(rows, params) {
  return rows
    .filter((row) =>
      [...params].every(([key, value]) => {
        if (["select", "order", "limit", "offset", "on_conflict"].includes(key)) return true;
        if (value.startsWith("eq.")) return String(row[key]) === value.slice(3);
        if (value.startsWith("neq.")) return String(row[key]) !== value.slice(4);
        if (value.startsWith("is."))
          return value === "is.null" ? row[key] == null : String(row[key]) === value.slice(3);
        if (value.startsWith("in.("))
          return value.slice(4, -1).split(",").includes(String(row[key]));
        if (value.startsWith("gt.")) return String(row[key]) > value.slice(3);
        return true;
      }),
    )
    .slice(0, Number(params.get("limit") || 1000));
}
const api = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", `http://127.0.0.1:${appPort}`);
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, apikey, content-type, x-client-info, prefer, range, x-supabase-api-version, accept-profile, content-profile, x-retry-count, range-unit",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "content-range");
  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }
  const url = new URL(req.url, `http://127.0.0.1:${apiPort}`);
  const path = url.pathname;
  console.log(`[ui-api] ${req.method} ${path}`);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  let body = {};
  try {
    body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
  } catch {
    /* no JSON */
  }
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  let session = sessions.get(token);
  if (!session && token.endsWith(".local-ui-fixture")) {
    try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
      const scenario = payload.scenario || "owner";
      const id = scenario === "behaviorist" ? expertId : ownerId;
      session = {
        scenario,
        user: {
          id,
          aud: "authenticated",
          role: "authenticated",
          email: `${scenario}@ui.psiennik.test`,
          app_metadata: { provider: "email" },
          user_metadata: {},
          created_at: now,
        },
      };
    } catch {
      /* invalid fixture */
    }
  }
  const send = (value, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(value));
  };
  if (path === "/auth/v1/token") {
    if (!String(body.email || "").endsWith("@ui.psiennik.test") && !body.refresh_token)
      return send({ msg: "Użyj lokalnego konta @ui.psiennik.test." }, 400);
    const scenario = body.email?.split("@")[0] || "owner";
    const expert = scenario === "behaviorist";
    const user = {
      id: expert ? expertId : ownerId,
      aud: "authenticated",
      role: "authenticated",
      email: body.email,
      app_metadata: { provider: "email" },
      user_metadata: {},
      created_at: now,
    };
    const accessToken = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url")}.${Buffer.from(
      JSON.stringify({ sub: user.id, scenario, exp: Math.floor(Date.now() / 1000) + 86400 }),
    ).toString("base64url")}.local-ui-fixture`;
    sessions.set(accessToken, { user, scenario });
    return send({
      access_token: accessToken,
      refresh_token: "local-ui-review",
      expires_in: 86400,
      token_type: "bearer",
      user,
    });
  }
  if (path === "/auth/v1/user")
    return session ? send(session.user) : send({ msg: "Brak lokalnej sesji" }, 401);
  if (path === "/auth/v1/logout") return send({});
  if (path.startsWith("/storage/v1/object/sign/dog-photos/")) {
    const photo = path.split("/").pop();
    if (req.method === "POST") return send({ signedURL: `/object/sign/dog-photos/${photo}` });
    const index = Number(photo?.replace("photo", "")) || 1;
    const asset = JSON.parse(
      readFileSync(
        new URL(`src/assets/dog-profile-${Math.min(index, 4)}.jpg.asset.json`, root),
        "utf8",
      ),
    );
    res.writeHead(302, { Location: `https://psiennik.pl${asset.url}` }).end();
    return;
  }
  if (!session) return send({ message: "UI fixture session required" }, 401);
  const expert = session.scenario === "behaviorist";
  const scenarioDogs =
    session.scenario === "empty"
      ? []
      : session.scenario === "one"
        ? ids.slice(0, 1)
        : expert
          ? ids
          : ids.slice(0, 2);
  const allowed = [...scenarioDogs, ...(createdDogs.get(session.scenario) ?? [])];
  const table = path.replace("/rest/v1/", "");
  if (table === "rpc/redeem_dog_invite") {
    const code = String(body._code ?? "")
      .trim()
      .toUpperCase();
    const link = tables.behaviorist_links.find((row) => row.is_active && row.invite_code === code);
    if (link) {
      if (
        !tables.owner_behaviorists.some(
          (row) => row.owner_id === session.user.id && row.behaviorist_id === link.behaviorist_id,
        )
      ) {
        tables.owner_behaviorists.push({
          id: randomUUID(),
          owner_id: session.user.id,
          behaviorist_id: link.behaviorist_id,
          process_status: "active",
          created_at: now,
        });
      }
      return send({ dog_id: null, behaviorist_id: link.behaviorist_id });
    }
    const invite = tables.dog_invites.find((row) => row.code === code);
    if (!invite) return send({ message: "Nie znaleziono takiego kodu" }, 400);
    if (invite.used_at) return send({ message: "Ten kod został już wykorzystany" }, 400);
    if (
      !tables.dog_access.some(
        (row) => row.dog_id === invite.dog_id && row.user_id === session.user.id,
      )
    ) {
      tables.dog_access.push({
        id: randomUUID(),
        dog_id: invite.dog_id,
        user_id: session.user.id,
        role: invite.role,
        process_status: "active",
        created_at: now,
      });
    }
    createdDogs.set(session.scenario, [
      ...new Set([...(createdDogs.get(session.scenario) ?? []), invite.dog_id]),
    ]);
    invite.used_at = new Date().toISOString();
    invite.used_by = session.user.id;
    return send({ dog_id: invite.dog_id, behaviorist_id: null });
  }
  if (table.startsWith("rpc/"))
    return send(
      { message: "Ten podgląd nie wykonuje operacji administracyjnych ani zaproszeń." },
      400,
    );
  let rows =
    table === "user_roles"
      ? [{ user_id: session.user.id, role: expert ? "behaviorist" : "owner" }]
      : tables[table];
  if (!rows) return send({ message: `Unknown local fixture: ${table}` }, 404);
  if (table === "dogs") rows = rows.filter((row) => allowed.includes(row.id));
  if (table === "profiles") {
    rows = rows.filter(
      (row) =>
        row.id === session.user.id ||
        tables.dog_access.some(
          (mine) =>
            mine.user_id === session.user.id &&
            allowed.includes(mine.dog_id) &&
            tables.dog_access.some(
              (other) => other.dog_id === mine.dog_id && other.user_id === row.id,
            ),
        ),
    );
  }
  if (table === "owner_behaviorists")
    rows = rows.filter(
      (row) => row.owner_id === session.user.id || row.behaviorist_id === session.user.id,
    );
  if (table === "behaviorist_links")
    rows = rows.filter((row) => row.behaviorist_id === session.user.id);
  if (["entries", "dog_access", "dog_views"].includes(table))
    rows = rows.filter((row) => allowed.includes(row.dog_id));
  if (session.scenario === "readonly" && table === "dog_access")
    rows = rows.map((row) => ({ ...row, process_status: "completed" }));
  const matches = filterRows(rows, url.searchParams);
  if (req.method === "PATCH") {
    matches.forEach((row) => Object.assign(row, body));
    return send(req.headers.accept?.includes("vnd.pgrst.object") ? matches[0] : matches);
  }
  if (req.method === "DELETE")
    return send({ message: "Usuwanie jest wyłączone w podglądzie UI." }, 403);
  if (req.method === "POST") {
    if (!["entries", "entry_comments", "dogs", "dog_views"].includes(table))
      return send({ message: "Ta operacja jest wyłączona w podglądzie UI." }, 403);
    const row = {
      id: randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: now,
      author_id: session.user.id,
      author_role: expert ? "behaviorist" : "owner",
      owner_id: session.user.id,
      ...body,
    };
    tables[table].push(row);
    if (table === "dogs") {
      createdDogs.set(session.scenario, [...(createdDogs.get(session.scenario) ?? []), row.id]);
      tables.dog_access.push({
        id: randomUUID(),
        dog_id: row.id,
        user_id: session.user.id,
        role: "owner",
        process_status: "active",
        created_at: now,
      });
    }
    return send(req.headers.accept?.includes("vnd.pgrst.object") ? row : [row], 201);
  }
  let result = matches;
  if (table === "dogs" && url.searchParams.get("select")?.includes("dog_access"))
    result = result.map((row) => ({
      ...row,
      dog_access: tables.dog_access.filter(
        (a) => a.dog_id === row.id && a.user_id === session.user.id,
      ),
    }));
  if (table === "entries" && url.searchParams.get("select")?.includes("dogs("))
    result = result.map((row) => ({ ...row, dogs: tables.dogs.find((d) => d.id === row.dog_id) }));
  res.setHeader("Content-Range", result.length ? `0-${result.length - 1}/${result.length}` : "*/0");
  if (req.method === "HEAD") {
    res.writeHead(200).end();
    return;
  }
  if (req.headers.accept?.includes("vnd.pgrst.object")) return send(result[0] ?? null);
  return send(result);
});
api.listen(apiPort, "127.0.0.1", () => {
  const env = {
    ...process.env,
    VITE_SUPABASE_URL: `http://127.0.0.1:${apiPort}`,
    VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_ui_fixture",
    SUPABASE_URL: `http://127.0.0.1:${apiPort}`,
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_ui_fixture",
    SUPABASE_SERVICE_ROLE_KEY: "",
    SUPABASE_SECRET_KEY: "",
    ENABLE_DEMO_ACCOUNTS: "false",
    VITE_ENABLE_DEMO_ACCOUNTS: "false",
    VITE_UI_REVIEW: "true",
    LOVABLE_PREVIEW_HOST: "psiennik.pl",
  };
  const vite = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "dev",
      "--host",
      "127.0.0.1",
      "--port",
      String(appPort),
      "--strictPort",
    ],
    { cwd: root, env, stdio: "inherit" },
  );
  console.log(
    `Local UI review: http://127.0.0.1:${appPort}. Accounts: owner / one / empty / readonly / behaviorist @ui.psiennik.test. Any test password. In-memory data only.`,
  );
  const close = () => {
    vite.kill("SIGTERM");
    api.close();
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);
  vite.on("exit", () => api.close());
});
