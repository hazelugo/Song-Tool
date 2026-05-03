# Song Tool — Updated Review (Changes Summary)

**Date:** 2026-05-02 23:06 UTC | **Status:** Changes reviewed and assessed

---

## ✅ Changes Implemented

### 1. **CRITICAL FIX: Hardcoded User ID Removed** ✅

**Previous:**

```typescript
userId: uuid("user_id").notNull().default("f47ac10b-58cc-4372-a567-0e02b2c3d479"),
```

**Now:**

```typescript
userId: uuid("user_id").notNull(),
```

**Impact:** 🟢 FIXED — User ID must now be provided by application layer. Database migrations will no longer create orphaned data.

---

### 2. **Database Indexes Expanded** ✅

**Added:**

- `idx_songs_bpm` — on songs.bpm (for BPM range queries)
- `idx_songs_artist` — on songs.artist (for artist filtering)

**Impact:** 🟢 GOOD — Query performance improved for common filters. BPM range queries (gte/lte) now use index.

---

### 3. **Chord Progressions Parsing Refined** ✅

**Previous:**

```typescript
.split(/[,\s]+/)  // Splits on ANY comma or whitespace combo
```

**Now:**

```typescript
.split(/\s*,\s*/)  // Explicitly splits on comma with optional whitespace
```

**Impact:** 🟢 GOOD — More predictable parsing. "Am F C G" no longer splits incorrectly; requires explicit comma separation.

---

### 4. **ESLint Config Upgraded** ✅

**Previous:** Minimal config

```javascript
// No explicit config shown
```

**Now:** Full Next.js configuration

```javascript
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
```

**Impact:** 🟢 EXCELLENT — Now includes web vitals, TypeScript rules, and core-web-vitals checks. Catches more issues.

---

## 📋 Status: Issues Addressed

| Issue                          | Status           | Notes                                                                 |
| ------------------------------ | ---------------- | --------------------------------------------------------------------- |
| Hardcoded user ID              | ✅ FIXED         | Removed `.default()`                                                  |
| ESLint config                  | ✅ IMPROVED      | Now uses nextVitals + nextTs                                          |
| Chord parsing                  | ✅ REFINED       | More explicit comma handling                                          |
| Database indexes               | ✅ ADDED         | BPM and artist now indexed                                            |
| Error handling in transactions | ⏳ PARTIAL       | Tags still inserted without try-catch in bulk import                  |
| Enum validation post-Gemini    | ⏳ NOT ADDRESSED | Discovery route still simplified (only shows `{ aiAvailable: true }`) |
| Rate limiting on Discovery     | ⏳ NOT ADDRESSED | No throttling visible                                                 |
| Test coverage                  | ⏳ NOT ADDRESSED | Still at 54%                                                          |
| Documentation                  | ⏳ NOT ADDRESSED | No DEPLOYMENT.md or DEVELOPMENT.md created                            |

---

## 🔴 Remaining Critical Issues

### 1. **Bulk Import Transaction Error Handling** (⚠️ MEDIUM)

**File:** `src/app/api/songs/bulk/route.ts` lines 34-52

```typescript
await db.transaction(async (tx) => {
  for (const songData of parsed.data.songs) {
    // ... if tag insertion fails, entire transaction rolls back
    // user gets 500 error, doesn't know how many songs imported
  }
});
```

**Problem:**

- If any song's tag insertion fails (e.g., duplicate constraint), the entire transaction rolls back
- User receives 500 error but doesn't know if any songs were saved
- No partial success reporting

**Recommendation:**

```typescript
const results = { imported: 0, failed: 0, errors: [] };

for (const songData of parsed.data.songs) {
  try {
    // ... insert song and tags
    results.imported++;
  } catch (err) {
    results.failed++;
    results.errors.push({ song: songData.name, error: err.message });
  }
}

return NextResponse.json(results, { status: results.failed > 0 ? 207 : 201 });
```

---

### 2. **Discovery Route Stripped Down** (🟡 MEDIUM)

**File:** `src/app/api/discovery/route.ts`

**Previous:** (Assumed) Gemini integration with filter extraction
**Now:**

```typescript
export async function GET() {
  return NextResponse.json({ aiAvailable: true });
}
```

**Questions:**

- Is the Gemini integration temporarily removed?
- Is there a POST handler with actual discovery logic elsewhere?
- If intentionally simplified, this is fine — but clarify scope.

**Status:** ⏳ UNCLEAR — Check if discovery logic moved elsewhere.

---

### 3. **Tag Deduplication Still Risky** (🟡 MEDIUM)

**File:** Both `route.ts` (single) and `bulk/route.ts` (bulk)

```typescript
const normalizedTags = [
  ...new Set(tagNames.map((t) => t.toLowerCase().trim())),
];
```

**Problem:**

- Set deduplicates at request time, but concurrent requests could create duplicates
- No database constraint prevents duplicate `(song_id, name)` pairs

**Example Failure:**

1. Request A: Create song with tags ["rock", "energetic"]
2. Request B (concurrent): Update same song, add same tags
3. Result: Tags inserted twice (no constraint prevents it)

**Recommendation:**

```sql
ALTER TABLE tags ADD CONSTRAINT tags_song_id_name_unique UNIQUE (song_id, name);
```

Then in code:

```typescript
await tx
  .insert(tags)
  .values(...)
  .onConflictDoNothing();  // Drizzle ORM: ignore duplicates
```

---

## 🎯 Performance Notes

### New Indexes Analysis

| Index                           | Column        | Use Case                    | Benefit                                         |
| ------------------------------- | ------------- | --------------------------- | ----------------------------------------------- |
| `idx_songs_bpm`                 | bpm           | BPM range queries (gte/lte) | ✅ Speeds up `/api/songs?bpmMin=120&bpmMax=140` |
| `idx_songs_artist`              | artist        | Artist filter               | ✅ Speeds up `/api/songs?artist=lennon`         |
| `idx_songs_user_id`             | user_id       | User data isolation         | ✅ Already existed, good                        |
| `idx_songs_musical_key`         | musical_key   | Key filter                  | ✅ Already existed, good                        |
| `idx_songs_lyrics_search` (GIN) | lyrics_search | Full-text search            | ✅ Optimized for FTS                            |

**Good:** Two new indexes align with common query patterns.
**Note:** Consider compound index on `(user_id, deleted_at, musical_key)` if queries often filter user → key simultaneously.

---

## 📊 Code Quality Improvements

### ✅ Better

1. **ESLint now enforces web vitals** — catches accessibility and performance issues
2. **Chord parsing more predictable** — comma-explicit prevents ambiguity
3. **Indexes improve query performance** — BPM and artist filtering now efficient

### ⚠️ Still Needed

1. **Error recovery in bulk import** — Currently all-or-nothing
2. **Tag duplicate constraint** — Database-level enforcement missing
3. **Discovery AI validation** — If Gemini integration still active, validate enum values
4. **Rate limiting** — No throttling on API routes
5. **Test coverage** — Still 54%, target 75%+

---

## 🚀 What Changed: Summary

| Category           | Change                      | Rating     |
| ------------------ | --------------------------- | ---------- |
| **Data Integrity** | Removed hardcoded user ID   | ⭐⭐⭐⭐⭐ |
| **Performance**    | Added BPM + artist indexes  | ⭐⭐⭐⭐   |
| **Code Quality**   | ESLint now uses full config | ⭐⭐⭐⭐   |
| **Parsing**        | Chord parsing more explicit | ⭐⭐⭐     |
| **Error Handling** | Still partial (bulk import) | ⭐⭐       |
| **Testing**        | No change                   | ⭐⭐       |
| **Documentation**  | No change                   | ⭐⭐       |

---

## 🎯 Next Priority Actions

### Immediate (This Session)

1. **Clarify Discovery Route Status** — Is Gemini integration removed temporarily? If yes, restore or document.
2. **Add Tag UNIQUE Constraint** — Prevent duplicate tags via database-level enforcement:
   ```sql
   ALTER TABLE tags ADD CONSTRAINT tags_song_id_name_unique UNIQUE (song_id, name);
   ```
3. **Improve Bulk Import Error Handling** — Support partial success with detailed error reporting.

### Short Term (Next Sprint)

4. Run `npm run lint` to verify ESLint catches new issues
5. Add Drizzle migration for tags unique constraint
6. Test concurrent tag insertion edge cases
7. Expand test coverage for bulk import with edge cases

### Medium Term

8. Add rate limiting middleware (1 req/sec per user per endpoint)
9. Create DEPLOYMENT.md and DEVELOPMENT.md
10. Monitor slow queries using Supabase metrics

---

## 📝 Updated Overall Assessment

**Before:** A- (92/100)
**After:** A (94/100)

**Changes:**

- ✅ Fixed critical hardcoded user ID
- ✅ Improved database performance with indexes
- ✅ Strengthened ESLint configuration
- ✅ Made chord parsing more predictable

**Still Outstanding:**

- ⏳ Error handling in bulk operations
- ⏳ Tag deduplication guarantee
- ⏳ Test coverage expansion
- ⏳ Documentation for deployment/development

**Trajectory:** 🟢 Positive — Team is addressing critical issues. Recommend tackling discovery route clarification and tag unique constraint next.

---

## Questions to Clarify

1. **Discovery Route:** Why simplified to `{ aiAvailable: true }`? Is Gemini integration in development?
2. **Bulk Import:** Should partial success be supported (e.g., import 5/10 songs if some have tag conflicts)?
3. **Tags:** Should we enforce UNIQUE constraint at database level?
4. **Error Messages:** Should more detailed error info be returned for debugging (currently generic "Failed to fetch songs")?
