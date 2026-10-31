/**
 * Read-only audit of existing Redirect rows against the rules enforced since
 * redirect validation was added. Rows that fail are not served by the
 * catch-all route (they 404); fix or delete them in Admin → Redirects.
 * Performs only SELECTs.
 */
import { PrismaClient } from "@prisma/client";
import { findRedirectConflict, safeStoredRedirect, validateFromPath, validateToPath } from "../lib/redirects";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.redirect.findMany({
    select: { fromPath: true, toPath: true, type: true, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  let failing = 0;
  for (const [i, row] of rows.entries()) {
    const reasons: string[] = [];
    const from = validateFromPath(row.fromPath);
    const to = validateToPath(row.toPath);
    if (!from.ok) reasons.push(from.reason);
    if (!to.ok) reasons.push(to.reason);
    if (from.ok && to.ok) {
      const others = rows.filter((_, j) => j !== i);
      const conflict = findRedirectConflict({ fromPath: from.value, toPath: to.value }, others);
      if (conflict) reasons.push(conflict);
      if (from.value !== row.fromPath) reasons.push(`Stored From path is not normalized (would be ${from.value}).`);
    }
    if (!safeStoredRedirect(row)) reasons.push("Not served by the catch-all (404).");

    if (reasons.length > 0) {
      failing++;
      console.log(`FAIL ${row.fromPath} -> ${row.toPath} [${row.type}${row.isActive ? "" : ", inactive"}]`);
      for (const r of reasons) console.log(`     - ${r}`);
    }
  }

  console.log(`\n${rows.length} redirect rules, ${failing} failing.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message.split("\n")[0] : "Audit failed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
