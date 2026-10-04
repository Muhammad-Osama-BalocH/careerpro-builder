# CAREERPROOF FINAL AUDIT

**Date:** September 20, 2026  
**Scope:** Full product audit — 20+ areas  
**Method:** Codebase inspection via 6 parallel agents, no runtime testing, no modifications  
**Status:** READ-ONLY — no source code was modified

---

## 1. Executive Summary

CareerProof is an AI-powered career intelligence platform built on Next.js 15 / React 19 / TypeScript / Tailwind CSS / Firebase / Gemini / GitHub API. The product implements a sophisticated pipeline: **Profile → Skills → Evidence → Strengths → Gaps → Target Role → Readiness → Job Description → Missing Skills → Project Recommendation → Blueprint → Roadmap → Documentation → Portfolio**.

The deterministic intelligence pipeline (evidence → skill intelligence → evidence reports → gap analysis → readiness → recommendations) is well-architected, fully tested (8 test suites), and correctly prevents AI from modifying scores or fabricating data. All 15 Gemini request types are supported and grounded in user data. The core computation libraries are solid.

However, the application has **multiple production blockers**: unauthenticated API routes, a missing `.gitignore`, GitHub OAuth CSRF vulnerability, `.firebaserc` pointing to the wrong project, incomplete public profile, missing composite Firestore index, and significant SEO gaps. The app is **not production-ready** without addressing these.

---

## 2. Critical Findings

| # | File | Issue | Evidence |
|---|------|-------|----------|
| C1 | `.gitignore` (missing) | **No `.gitignore` in project root.** `node_modules/`, `.env.local`, `.next/` are all untracked. `.env.local` contains live secrets (Firebase Admin private key, GitHub client secret, Gemini API key). If ever committed to git, all credentials are permanently compromised. | `git status` shows `?? .env.local`, `?? node_modules/`, `?? .next/` |
| C2 | `app/api/gemini/route.ts`, `app/api/resume/route.ts` | **No authentication on API routes.** Anyone can call `/api/gemini` and `/api/resume` without being logged in, consuming your Gemini API quota at unlimited scale. | No `userId` extraction, no ID token verification, no `adminAuth.verifyIdToken()` |
| C3 | `app/api/auth/callback/github/route.ts` | **OAuth state parameter used as both CSRF token and user ID.** No separate nonce. An attacker can craft a callback URL with any `state` value to write tokens under arbitrary user IDs. | `state` is set to `user.uid` directly; no nonce verification in callback |

---

## 3. High Findings

| # | File | Issue | Evidence |
|---|------|-------|----------|
| H1 | `app/career/page.tsx` | **Target role field desync.** `profile.targetRole` is set by the AI recommendation engine, but the UI dropdown also has `profile.targetRoles[]` (plural). When AI sets `targetRole` to a value not in `targetRoles`, the dropdown shows a stale selection. | `setProfile(prev => ({ ...prev, targetRole: rec.relatedGap \|\| prev.targetRole }))` overwrites the dropdown value |
| H2 | `app/career/page.tsx` | **Unsupported roles offered in UI.** The target role dropdown offers roles (DevOps, data scientist, etc.) that have no `ROLE_SKILL_PROFILES` entry, producing empty gap analysis. | `lib/careerGapIntelligence.ts:24-80` — only 3 roles defined |
| H3 | `app/career/page.tsx:1129` | **GitHub disconnect doesn't revoke or delete token.** Sets `isConnected: false` in Firestore profile but the access token remains valid at GitHub and the `githubTokens/{userId}` document is never deleted. | No call to GitHub token revocation endpoint, no `adminDb.collection('githubTokens').doc(userId).delete()` |
| H4 | `app/public-profile/[id]/page.tsx` | **Public profile barely renders portfolio data.** Fetches portfolio, checks `isPublic`, but JSX only shows `CareerJourney` and `SkillEvidenceList`. No skills, projects, experience, education, or readiness scores. | Portfolio data stored in state but unused in render |
| H5 | `components/ProtectedRoute.tsx:16-18` | **Silently allows access when Firebase unconfigured.** `if (!auth \|\| !isFirebaseConfigured) { return; }` — missing env vars = all protected pages publicly accessible. | Returns `undefined` (renders nothing) instead of redirecting or showing error |
| H6 | `lib/firebase-admin.ts:44-45` | **Null-casted Firestore/Auth exports.** If `adminApp` is null, `adminDb` and `adminAuth` are `null as unknown as Firestore`. Any server code calling these gets a runtime TypeError instead of a descriptive error. | `export const adminDb: Firestore = adminApp ? getFirestore(adminApp) : (null as unknown as Firestore)` |
| H7 | `.firebaserc:3` | **Default Firebase project mismatch.** `.firebaserc` defaults to `ai-portfolio-builder-2a05c` but the app uses `ai-portfolio-builder-ba722`. Running `firebase deploy` sends rules to the wrong project. | `"default": "ai-portfolio-builder-2a05c"` vs `NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-portfolio-builder-ba722` |
| H8 | `app/career/page.tsx:~796-804`, `components/career/NextBestAction.tsx:55-62` | **Dead buttons: "Technical Blueprint" and "Development Roadmap" have no onClick handler.** Users click and nothing happens. | `<Button ...>Technical Blueprint</Button>` with no event binding |
| H9 | `app/dashboard/page.tsx:542` | **Delete without confirmation.** Clicking "Delete" permanently removes a portfolio from Firestore with no "Are you sure?" prompt. No undo. | `onClick={() => { void handleDelete(item.id); }}` |
| H10 | `app/career/page.tsx:~880+` | **Duplicate Blueprint/Roadmap/Docs rendering.** Career page renders these both inline AND via ProjectExplorer. User sees the same data twice with different layouts. | Inline cards + `<ProjectExplorer>` both render blueprint/roadmap/docs |
| H11 | `lib/careerGapIntelligence.ts:91-97` | **`classifyEvidenceLevel` maxes at "moderate"; "strong" evidence level is unreachable.** Even advanced skills get `currentEvidenceLevel: 'moderate'`, making gap details semantically misleading. | `if (si.strengthLevel === 'strong' \|\| si.strengthLevel === 'advanced') return 'moderate'` — no code path returns `'strong'` |

---

## 4. Medium Findings

| # | File | Issue | Evidence |
|---|------|-------|----------|
| M1 | `app/api/github/repos/route.ts` | **No input validation.** `userId` query param is used directly in Firestore doc path without sanitization. | `adminDb.collection('githubTokens').doc(userId).get()` |
| M2 | All API routes | **No rate limiting.** No throttle on any API endpoint. | No rate limiting middleware |
| M3 | `lib/firebase-admin.ts` | **GitHub tokens stored in plaintext in Firestore.** No encryption at rest. | `adminDb.collection('githubTokens').doc(userId).set({ accessToken: tokenData.access_token })` |
| M4 | `app/builder/page.tsx` | **No form validation before save.** Portfolios with empty name/title/about can be persisted. | `handleSave` calls `addDoc`/`updateDoc` with no validation |
| M5 | `components/templates/registry.ts` | **Duplicate template mappings.** `modern` = `creative` (same component), `dark` = `professional` (same component). Misleading to users. | `modern: { component: PortfolioTemplate2 }`, `creative: { component: PortfolioTemplate2 }` |
| M6 | `app/builder/page.tsx` + `app/dashboard/page.tsx` | **Duplicated portfolio save logic.** Same `handleSave()` pattern in both pages. Changes must be made in both places. | Both have identical addDoc/updateDoc + userId + timestamp pattern |
| M7 | `next.config.ts:6` | **`outputFileTracingRoot: path.join(__dirname)` is redundant** and may cause Vercel path issues. | This is the default; setting explicitly adds risk with no benefit |
| M8 | Two Gemini SDK packages | **`@google/generative-ai` + `@google/genai` both installed.** Different SDKs used in different routes. Bloat and confusion. | `app/api/gemini/route.ts` uses `@google/generative-ai`; `app/api/resume/route.ts` uses `@google/genai` |
| M9 | `app/api/gemini/route.ts` | **No retry on Gemini failures.** `generateText()` has no retry; the outer catch doesn't distinguish error status codes (429, 503). | Single try/catch with throw-through. Compare with resume route which has `callWithRetry()` |
| M10 | `components/career/AIRecommendations.tsx` | **Dual recommendation system.** Legacy flat string array (`careerRecommendations`) vs. structured objects (`structuredCareerRecommendations`). Both exist, both call `/api/gemini`. | `AIRecommendations.tsx` imports `generateCareerRecommendations`; career page imports `generateStructuredCareerRecommendations` |
| M11 | `app/api/gemini/route.ts:~609` | **Misleading JSON parse error.** Says "Failed to generate skills in the correct format" regardless of which type failed (could be `jobDescription`, `projectBlueprint`, etc.). | Hardcoded error string in JSON parse catch block |
| M12 | `app/api/github/repos/route.ts:26` | **No pagination beyond 100 repos.** `per_page=100` with no Link-header traversal. Users with >100 repos won't see all of them. | Single `fetch()` call with no pagination |
| M13 | `app/dashboard/page.tsx:~176` | **`handleDelete()` has no try/catch.** Failed Firestore delete is completely silent. | `await deleteDoc(...)` with no error handling |
| M14 | `components/Navbar.tsx:~20` | **`handleSignOut()` has no try/catch.** Failed sign-out gives no feedback. | `await signOut(auth)` with no error handling |
| M15 | Firestore | **`careerEvidence` composite index missing.** The `public-profile` page queries with both `where('userId', '==', ...)` and `where('sourceType', '==', 'github')`, requiring a composite index not defined anywhere. | No `firestore.indexes.json` file exists; query will fail at runtime |
| M16 | `lib/gemini.ts:64-69` | **`generateHighlights` is dead code.** Exported and its type `'highlights'` is handled in `route.ts`, but no UI component ever calls it. | Zero call sites found for `generateHighlights` across all `.ts/.tsx` files |

---

## 5. Low Findings

| # | File | Issue | Evidence |
|---|------|-------|----------|
| L1 | `app/career/page.tsx:40-47` | Certification/achievement IDs use `Date.now()`, can collide in rapid succession | `id: cert-${Date.now()}` |
| L2 | `lib/skillIntelligence.ts:135` | `inferCategory()` doesn't handle `github` source type explicitly — falls to `'other'` | No case for `sourceType === 'github'` |
| L3 | `lib/skillIntelligence.ts:13-57` | `TECH_RELATIONSHIPS` map incomplete (no SvelteKit, Remix, Fastify, Prisma, Supabase, etc.) | ~30 technologies covered |
| L4 | `lib/evidence.ts:48,136` | Evidence IDs use `Date.now() + Math.random()`, not guaranteed unique | Format: `ev-${Date.now()}-${Math.random()...}` |
| L5 | `app/career/page.tsx:178-200` | Evidence temporarily unavailable during rebuild (delete-then-reinsert). No progress indicator beyond boolean spinner. | `handleBuildEvidence()` first deletes all docs |
| L6 | `lib/evidence.ts:120` | Certification evidence only matches skills already in `portfolio.skills`. Won't discover new skills from cert names. | `deriveCertificationEvidence()` iterates `portfolio.skills` |
| L7 | `types/portfolio.ts:63-69` | `bannerUrl`, `skillDetails`, `socialLinks`, `achievements` fields defined but never read or written. Dead schema. | No component references these fields |
| L8 | `firestore.rules:41-62,78-95,97-115` | `careerSkills`, `careerGaps`, `careerRecommendations` collections have security rules but no application code reads or writes them. Dead rules. | Grep returns zero collection references |
| L9 | `components/career/GitHubRepositoryList.tsx:42` | `catch (err: any)` TypeScript anti-pattern | `} catch (err: any) { setError(err.message); }` |
| L10 | `.env.local:3` | `NEXT_PUBLIC_FIREBASE_DATABASE_URL` configures RTDB but app only uses Firestore | No RTDB usage in code |

---

## 6. Production Blockers

| # | Blocker | Required Action |
|---|---------|-----------------|
| 1 | **No `.gitignore`** | Create `.gitignore` with `node_modules/`, `.next/`, `.env.local`, `.env*.local`. If `.env.local` was ever committed, rotate ALL secrets. |
| 2 | **Unauthenticated API routes** | Add Firebase ID token verification to `/api/gemini` and `/api/resume`. Use `/api/github/repos/route.ts` as reference pattern. |
| 3 | **GitHub OAuth CSRF** | Generate random nonce for `state`, store in cookie, verify in callback. Use Firebase ID token (via cookie/header) for user identity instead of `state` param. |
| 4 | **Firebase Admin credentials not configured** | Set `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` in `.env.local`. |
| 5 | **`.firebaserc` default project mismatch** | Update `.firebaserc` to use `ai-portfolio-builder-ba722` as the default project, or explicitly specify the project in `firebase deploy` commands. |
| 6 | **GitHub OAuth callback URL must be production URL** | Register production callback URL in GitHub OAuth app settings. |
| 7 | **Model name `gemini-3.6-flash` may not exist** | Verify the model name corresponds to a valid Gemini API model. Standard names: `gemini-1.5-flash`, `gemini-2.0-flash`. |
| 8 | **No robots/sitemap** | Create `app/robots.ts` and `app/sitemap.ts` before public deployment. |
| 9 | **Public profile barely functional** | Must render skills, projects, experience, readiness for recruiter usability. Also requires `isPublic` Firestore rule on `careerProfiles`. |
| 10 | **Missing composite Firestore index** | Create `firestore.indexes.json` with composite index on `careerEvidence` for `(userId, sourceType)`. |

---

## 7. Authentication Audit

| Auth Feature | Status | Details |
|---|---|---|
| Email/password signup | ✅ Working | `components/Auth.tsx` — `createUserWithEmailAndPassword` |
| Email/password login | ✅ Working | `components/Auth.tsx` — `signInWithEmailAndPassword` |
| Google login | ✅ Working | `components/Auth.tsx` — `signInWithPopup(googleProvider)` |
| Logout | ⚠️ Partial | `components/Navbar.tsx` — `signOut(auth)` but no try/catch (M14) |
| Auth persistence | ✅ Working | `lib/firebase.ts` — `browserLocalPersistence` set on init |
| Re-login after logout | ✅ Working | Persistence restores session on reload |
| Firebase UID consistency | ✅ Working | All Firestore writes use `user.uid`; rules enforce `request.auth.uid == resource.data.userId` |
| Protected routes (client-side) | ⚠️ Partial | `components/ProtectedRoute.tsx` — redirects to `/login`, but silently allows access when Firebase unconfigured (H5) |
| Protected routes (server-side) | ❌ Missing | No `middleware.ts` exists; all protection is client-side only |
| API route auth (GitHub repos) | ✅ Working | `adminAuth.verifyIdToken(idToken)` properly implemented |
| API route auth (Gemini) | ❌ Missing | Zero authentication (C2) |
| API route auth (Resume) | ❌ Missing | Zero authentication (C2) |
| GitHub OAuth callback auth | ❌ Broken | Trusts `state` param as user ID without verifying session (C3) |
| Account/provider linking | ❌ Missing | `account-exists-with-different-credential` shows message but no merge/link flow |
| Password strength | ⚠️ Partial | Only Firebase default 6-char minimum; no complexity check, no strength meter |

---

## 8. Firebase / Firestore Audit

### Firebase Client SDK
- `lib/firebase.ts` — Correctly initializes with `NEXT_PUBLIC_*` env vars
- `setPersistence(auth, browserLocalPersistence)` — set but failure is silently swallowed
- Auth persistence failure only logged to console, no user-facing feedback

### Firebase Admin SDK
- `lib/firebase-admin.ts` — Now supports env-var credentials (`FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`)
- Falls back to `GOOGLE_APPLICATION_CREDENTIALS` if set
- **Env vars not yet configured** in `.env.local` — Admin SDK will fail to initialize
- **Null-casted exports** — `adminDb` and `adminAuth` are `null as unknown as Firestore/Auth` when Admin SDK fails (H6)

### `.firebaserc` Project Mismatch
- Default project in `.firebaserc` is `ai-portfolio-builder-2a05c`
- Application uses `ai-portfolio-builder-ba722` (from `NEXT_PUBLIC_FIREBASE_PROJECT_ID`)
- Running `firebase deploy` will deploy Firestore rules to the **wrong project** (H7)

### Missing Composite Index
- `app/public-profile/[id]/page.tsx` queries `careerEvidence` with both `where('userId', '==', ...)` and `where('sourceType', '==', 'github')`
- This composite query requires a Firestore index that is not defined in any `firestore.indexes.json`
- Query will fail at runtime (M15)

### Unused RTDB Configuration
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL` points to a Realtime Database instance
- App only uses Firestore — RTDB URL is unnecessary (L10)

---

## 9. Gemini Request-Type Audit

| # | Feature | Request Type | Supported in `route.ts`? | Called by UI? | Grounded in User Data? | Status |
|---|---------|-------------|--------------------------|---------------|------------------------|--------|
| 1 | About Me Generator | `about` | ✅ | ✅ Builder page | ✅ name, title, experience | Working |
| 2 | Project Description Generator | `project` | ✅ | ✅ Builder page | ✅ project name, summary, techStack | Working |
| 3 | Skills Suggestions | `skills` | ✅ | ✅ Builder page | ✅ role, domain, existingSkills | Working |
| 4 | Experience Description Generator | `experience` | ✅ | ✅ Builder page | ✅ company, role, brief | Working |
| 5 | Achievement Highlights Generator | `highlights` | ✅ | ❌ **DEAD CODE** | N/A — never called | Dead (M16) |
| 6 | Education Description Generator | `education` | ✅ | ✅ Builder page | ✅ school, degree, field | Working |
| 7 | Project Tech Stack Suggestions | `projectTechStack` | ✅ | ✅ Builder page | ✅ projectName, description | Working |
| 8 | Headline Suggestions | `headline` | ✅ | ✅ Builder page | ✅ name, about, skills | Working |
| 9 | Career Recommendations (legacy) | `careerRecommendations` | ✅ | ✅ `AIRecommendations.tsx` | ✅ readiness, strengths, gaps | Working (legacy) |
| 10 | Structured Career Recommendations | `structuredCareerRecommendations` | ✅ | ✅ Career page | ✅ targetRole, demonstratedSkills, gaps | Working |
| 11 | Project Ideas | `projectIdeas` | ✅ | ✅ Career page | ✅ career gaps, demonstrated skills | Working |
| 12 | Project Blueprint | `projectBlueprint` | ✅ | ✅ Career page | ✅ project details + gaps | Working |
| 13 | Project Roadmap | `projectRoadmap` | ✅ | ✅ Career page | ✅ blueprint data | Working |
| 14 | Project Docs Pack | `projectDocsPack` | ✅ | ✅ Career page | ✅ blueprint + roadmap | Working |
| 15 | Job Description Analyzer | `jobDescription` | ✅ | ✅ `JobDescriptionAnalyzer.tsx` | ⚠️ Partial — `evidenceCoverage` is AI-estimated, not computed | Working but weakly grounded |
| 16 | Resume Extraction | *(separate route `/api/resume`)* | ✅ | ✅ `ResumeImport.tsx` | ✅ actual PDF content | Working |

**Model config:** `GEMINI_API_KEY || GOOGLE_API_KEY`, defaults to `'gemini-3.6-flash'` (may not be a valid model name — production blocker #7).

**API key handling:** Two-env-var fallback (`GEMINI_API_KEY` then `GOOGLE_API_KEY`). If neither set, all Gemini features return 500.

**Error handling gaps:**
- No retry logic on 429/503 (resume route has retry, main Gemini route does not — M9)
- JSON parse error says "skills" regardless of type (M11)
- No rate limiting or debouncing on any endpoint (M2)

---

## 10. GitHub OAuth Audit

### Current Flow

```
1. User clicks "Connect GitHub" (app/career/page.tsx:~1139)
   → Guard: if (!user?.uid) return
   → Builds URL: https://github.com/login/oauth/authorize
     - client_id = NEXT_PUBLIC_GITHUB_CLIENT_ID
     - redirect_uri = /api/auth/callback/github
     - scope = read:user
     - state = user.uid (encodeURIComponent'd)

2. GitHub redirects to callback (app/api/auth/callback/github/route.ts)
   → Extracts code + state (= userId)
   → if (!code || !userId) → redirect /career?error=auth_failed
   → Exchanges code for access_token (POST github.com/login/oauth/access_token)
   → Fetches GitHub user profile (GET api.github.com/user)
   → Stores token: adminDb.collection('githubTokens').doc(userId).set({
       accessToken, updatedAt
     })
   → Updates careerProfiles: githubConnection = { isConnected: true, username, githubId }
   → Redirects to /career?success=github_connected

3. Repository fetching (app/api/github/repos/route.ts)
   → Requires userId query param
   → Verifies Firebase ID token (adminAuth.verifyIdToken)
   → Reads githubTokens/{userId} from Firestore
   → Fetches repos via GitHub API (no pagination beyond 100)
   → Returns repo list
```

### Issues

| Severity | Issue | Detail |
|----------|-------|--------|
| **CRITICAL** | No CSRF protection on `state` (C3) | The `state` param is just the user UID — no random nonce. An attacker who knows a UID can forge the callback URL to inject a GitHub token under that user's ID. |
| **HIGH** | Token not revoked or deleted on disconnect (H3) | "Disconnect" sets `isConnected: false` in profile but doesn't delete `githubTokens/{userId}` or call GitHub's token revocation endpoint. |
| **MEDIUM** | Token stored plaintext (M3) | `accessToken` stored as plain string in Firestore. No encryption. |
| **MEDIUM** | No token expiration tracking | Only `updatedAt` stored, no `expiresAt` or scope info. |
| **MEDIUM** | No pagination beyond 100 repos (M12) | Single fetch with `per_page=100`, no Link-header traversal. |
| **LOW** | Generic error redirect | All errors redirect to `?error=auth_failed` regardless of type. |
| **INFO** | Production callback URL | Must match exactly what's registered in GitHub OAuth app settings. Hard-coded as `${window.location.origin}/api/auth/callback/github`. |

---

## 11. GitHub Repository Import Audit

### Repository Fetching (`app/api/github/repos/route.ts`)
- ✅ Server-side authentication via `adminAuth.verifyIdToken()` — properly implemented
- ✅ `GITHUB_CLIENT_SECRET` used only server-side
- ✅ Returns `isPrivate` field; evidence derivation correctly skips private repos
- ⚠️ No pagination — capped at 100 repos (M12)
- ⚠️ No input validation on `userId` param (M1)

### GitHub Evidence Derivation (`lib/evidence.ts:deriveGitHubEvidence`)
- ✅ Only public repos generate evidence (`if (repo.isPrivate) continue`)
- ✅ Languages from repos produce "strong" evidence; topics produce "moderate"
- ✅ Deduplication by `${skill.toLowerCase()}-github-${repoId}`
- ⚠️ Repo descriptions are not analyzed for skill mentions (only language + topics)
- ⚠️ GitHub-only skills default to category `'other'` in `inferCategory()` (L2)

### Error Handling
- GitHub repo fetch failure during evidence build is silently logged — user never informed that evidence is incomplete

---

## 12. Career Intelligence Audit

### What Works
| Component | Status | Evidence |
|-----------|--------|----------|
| Career Readiness scoring | ✅ Complete | `lib/careerScoring.ts` — 5 weighted categories, deterministic |
| Skill Intelligence | ✅ Complete | `lib/skillIntelligence.ts` — deterministic, tested (8 tests) |
| Evidence Intelligence | ✅ Complete | `lib/evidenceIntelligence.ts` — traceable reports, 16 tests |
| Gap Analysis (defined roles) | ✅ Complete | `lib/careerGapIntelligence.ts` — 15 tests |
| Recommendation Engine | ✅ Complete | `lib/careerRecommendationEngine.ts` — grounded validation, 14 tests |
| AI/deterministic boundary | ✅ Enforced | AI cannot modify scores; `validateRecommendations()` filters ungrounded output |
| Profile completeness | ✅ Complete | 11 areas tracked with visual indicators |

### What Is Partial
| Issue | Severity | Detail |
|-------|----------|--------|
| Only 3 role profiles defined | H2 | `ROLE_SKILL_PROFILES`: frontend, backend, full-stack only. Other roles produce empty analysis. |
| `targetRoles` vs `targetRole` desync | H1 | Two independent fields; gap analysis and Role Readiness can reference different targets. |
| `classifyEvidenceLevel` caps at "moderate" | H11 | The "strong" evidence level is unreachable; `currentEvidenceLevel` is misleading for advanced skills. |
| Certification evidence only matches existing skills | L6 | Cert "AWS Solutions Architect" won't produce evidence for "AWS" unless already listed. |
| No field validation before profile save | M4 | Empty profiles can be persisted. |

---

## 13. JD Analyzer Audit

**Component:** `components/career/analyzer/JobDescriptionAnalyzer.tsx`  
**Gemini type:** `jobDescription` — added to `route.ts` switch and JSON-parse branch

### What Works
- ✅ Accepts `skillIntelligence`, `evidence`, and `targetRole` as props
- ✅ User pastes JD text into textarea; empty input guarded
- ✅ Calls `analyzeJobDescription({ jobDescriptionText, userSkills, targetRole })`
- ✅ Displays match percentage, matched/missing/developing skills, recommendations
- ✅ Error handling for network/API failures (red alert div)

### What Is Weak
| Issue | Severity | Detail |
|-------|----------|--------|
| `evidenceCoverage` is AI-estimated, not computed | Low | Prompt says "if no evidence data is available, use 50". Component has `evidence` prop but only sends flat skill names. |
| No server-side validation of JD analysis | Medium | Unlike all other career intelligence types, JD response is returned directly with no validation engine. Hallucinated skills could pass through. |
| No cross-reference with deterministic gap analysis | Medium | JD analysis runs independently from `CareerGapAnalysis`; no reconciliation between the two gap-detection mechanisms. |
| No retry logic | Low | Single attempt; user must manually re-click on failure. |

---

## 14. Project / Blueprint / Roadmap Audit

### Architecture

The project intelligence pipeline is a **sequential chain** where each step's validated output feeds the next:

```
Career Gap Analysis (deterministic)
  → Structured Career Recommendations (AI, validated by careerRecommendationEngine.ts)
  → Project Ideas (AI, validated by projectIdeaEngine.ts)
  → Project Blueprint (AI, validated by projectBlueprintEngine.ts)
  → Development Roadmap (AI, validated by roadmapEngine.ts)
  → Documentation Pack (AI, validated by docsPackEngine.ts)
```

### Grounding Enforcement

| Engine | Grounding Check |
|---|---|
| `careerRecommendationEngine.ts` | Each recommendation must reference a known career gap (string matching on `relatedGap`, `relatedSkill`, `reason`, `description`) |
| `projectIdeaEngine.ts` | `relatedGap` must match a known gap; ideas without match are rejected; max 3 |
| `projectBlueprintEngine.ts` | `relatedGap` must match the input gap |
| `roadmapEngine.ts` | `relatedGap` must match blueprint's gap; max 8 phases, 8 milestones/phase, 15 tasks/milestone |
| `docsPackEngine.ts` | `projectTitle` must match input; scans for fake-achievement patterns ("you already have", "your expertise in") |

### Cascading Dependencies

| Step | Prerequisite | Cannot generate without |
|---|---|---|
| Structured Recommendations | targetRole + gap/skill data | `buildRecommendationInput()` returns null if no targetRole |
| Project Ideas | targetRole + at least one gap | `buildProjectIdeasInput()` returns null if gaps.length === 0 |
| Project Blueprint | Selected project idea with title | `buildBlueprintInput()` returns null if no selectedIdea |
| Development Roadmap | Valid blueprint | `buildRoadmapInput()` returns null if no blueprint |
| Documentation Pack | Valid blueprint | `buildDocsInput()` returns null if no blueprint |

### Key Limitation
Only 3 role profiles defined (H2) — users with other target roles get no gap analysis, blocking the entire pipeline.

### UI Issues
- Duplicate Blueprint/Roadmap/Docs rendering (H10)
- Dead "Technical Blueprint" and "Development Roadmap" buttons in NextBestAction (H8)

---

## 15. Portfolio Builder Audit

### Architecture
- **Route:** `/builder` (protected by `ProtectedRoute` in layout)
- **Editor:** Tab-based (Personal, About, Skills, Projects, Experience, Education)
- **Preview:** Live preview panel renders the selected template component in real time
- **Save:** `addDoc` (new) or `updateDoc` (existing) to Firestore `portfolios` collection
- **Public/Private:** `isPublic` toggle defaults to true

### Templates (6 registered, 3 unique components)

| Key | Label | Component |
|---|---|---|
| `minimal` | Minimal Professional | `PortfolioTemplate1` |
| `creative` | Creative | `PortfolioTemplate2` |
| `professional` | Professional | `PortfolioTemplate3` |
| `dark` | Dark | `PortfolioTemplate3` ← **same as professional** (M5) |
| `developer` | Developer | `DeveloperTemplate` |
| `modern-ai` | Modern AI | `ModernAITemplate` |

### Issues

| Severity | Issue | Detail |
|----------|-------|--------|
| M5 | Duplicate template mappings | `dark` = `professional`, `modern` alias = `creative` |
| M4 | No form validation before save | Empty portfolios can be persisted |
| M6 | Duplicated save logic | Identical `handleSave()` in builder and dashboard |
| — | No unpublish confirmation | Toggling public→private saves immediately |
| — | No field-level privacy | `ContactInfo` renders email, phone, location to all visitors |
| — | `PortfolioPreview.tsx` is dead code | Builder uses `components/Preview.tsx` instead |

---

## 16. Public Profile / Recruiter Audit

**Route:** `/public-profile/[id]` where `[id]` is a `careerProfiles` document ID

### Critical Problem
The page is **non-functional for unauthenticated visitors** (its intended audience):

1. **Firestore rules block unauthenticated reads** on `careerProfiles` (`allow read: if request.auth != null && request.auth.uid == resource.data.userId`). Recruiters get permission-denied errors.
2. **Same restriction on `careerEvidence`** — owner-only reads.
3. **Composite index missing** — the `careerEvidence` query with `userId` + `sourceType` requires an index that doesn't exist (M15).

### What It Shows (if rules were fixed)
- Professional title and career summary
- Career Journey (achievements as steps)
- GitHub evidence only (filters `sourceType === 'github'`)

### What It Should Show But Doesn't
- Skills overview
- Projects showcase
- Experience timeline
- Education
- Career readiness score
- Link to the full portfolio (`/portfolio/{id}`)

---

## 17. UI/UX Audit

### Design System Inconsistencies

| Issue | Severity | Detail |
|-------|----------|--------|
| `stone` vs `slate` color system split | High | Landing page + Navbar use `stone` (warm); dashboard/builder/career use `slate` (cool) |
| `amber` vs `indigo` accent mismatch | High | `globals.css` defines amber accent; all authenticated pages use indigo |
| Design system typography tokens unused | Medium | `t-display`, `t-h1`, `t-h2`, `t-label` only used on landing page |
| Design system radius/shadow tokens unused | Medium | `rounded-cp`, `shadow-cp` tokens bypassed by career/dashboard pages |
| Invalid `bg-slate-25` class | Medium | Not a valid Tailwind color; ignored, no background rendered |
| Two different CollapsibleSection implementations | Medium | Dashboard inline vs career component have different styling/behavior |

### Dead UI Elements

| Issue | Severity | Detail |
|-------|----------|--------|
| All 10 footer links point to `href="#"` | High | Product, Resources, Legal, Social — all dead |
| NextBestAction Blueprint/Roadmap buttons dead | High | No onClick handler (H8) |
| Duplicate Blueprint/Roadmap rendering | High | Inline + ProjectExplorer (H10) |

### Missing States

| Issue | Severity | Detail |
|-------|----------|--------|
| No `error.tsx` or `not-found.tsx` at any route level | High | White-screen crash on unexpected errors |
| Dashboard has no empty/onboarding state | High | Compare with career page's well-designed onboarding |
| Delete without confirmation | High | One-click permanent deletion (H9) |
| No loading skeletons on most pages | Medium | Only career page has a skeleton; others show plain "Loading..." text |
| Readiness score = 0 shows blank hero | Medium | No contextual text for zero score |

### Accessibility

| Issue | Severity | Detail |
|-------|----------|--------|
| No `aria-expanded` on collapsible toggle buttons | Medium | `CollapsibleSection`, `SkillIntelligenceList` |
| No `<label>` ↔ `<input>` associations | Medium | Dashboard/builder `FieldLabel` lacks `htmlFor`/`id` |
| "Remove" buttons lack `aria-label` | Low | No indication of what is being removed |
| Reduced-motion not enforced | High | No `MotionConfig reducedMotion="user"` at root; CSS media query doesn't affect JS animations |

### Animation Inconsistencies
- CareerScore uses CSS transition for readiness ring; CareerHero uses `motion.circle` with spring
- HoverLift effect is imperceptible at 1.5px
- Landing page hero hand-rolls motion variants instead of using shared primitives

---

## 18. Security Audit

| # | Severity | Finding | File | Detail |
|---|----------|---------|------|--------|
| S1 | CRITICAL | No `.gitignore` — secrets exposed | `.env.local` | Firebase Admin private key, GitHub client secret, Gemini API key all in plaintext |
| S2 | CRITICAL | Unauthenticated API routes | `app/api/gemini/route.ts`, `app/api/resume/route.ts` | No auth verification; anyone can consume Gemini quota |
| S3 | CRITICAL | OAuth state = userId (no CSRF nonce) | `app/api/auth/callback/github/route.ts` | Attacker can forge callbacks with any UID |
| S4 | HIGH | `ProtectedRoute` silently allows access if Firebase unconfigured | `components/ProtectedRoute.tsx:16-18` | `return;` renders nothing instead of blocking |
| S5 | HIGH | No server-side route protection | Missing `middleware.ts` | All pages accessible via direct URL |
| S6 | HIGH | GitHub token stored plaintext | `githubTokens` collection | No encryption at rest |
| S7 | HIGH | No token revocation on disconnect | `app/career/page.tsx:1129` | Token remains valid at GitHub; doc not deleted |
| S8 | MEDIUM | No input validation on API routes | All API routes | `userId`, `type`, `input` used unsanitized |
| S9 | MEDIUM | No rate limiting on API routes | All API routes | Unlimited calls possible |
| S10 | MEDIUM | `adminDb` null-cast can cause runtime crash | `lib/firebase-admin.ts:44-45` | `null as unknown as Firestore` — no guard |
| S11 | LOW | Error logs may contain token fragments | `app/api/auth/callback/github/route.ts:66` | `console.error('GitHub OAuth Detailed Error:', error)` |
| S12 | LOW | No account/provider linking | `components/Auth.tsx:24` | Separate accounts for email vs Google |
| S13 | LOW | No password strength enforcement | `components/Auth.tsx` | No minimum length, no complexity check |

---

## 19. Error Handling Audit

### Swallowed Console Errors (user never informed)

| File | Context | Impact |
|---|---|---|
| `app/career/page.tsx:360` | `console.error('Failed to fetch/derive GitHub evidence:', e)` | GitHub evidence silently omitted; user sees "Build Evidence" succeed with incomplete data |
| `lib/firebase.ts:34` | `console.warn('Failed to set auth persistence:', err)` | Could cause unexpected sign-outs; user sees nothing |
| `lib/firebase.ts:39` | `console.warn('Firebase was not initialized:', error)` | Firebase unavailable; no UI message |
| `lib/firebase-admin.ts:40` | `console.error('Firebase Admin SDK initialization failed:', error)` | Admin SDK down; exports null causing opaque crashes later |

### Missing try/catch

| File | Function | Issue |
|---|---|---|
| `app/dashboard/page.tsx:~176` | `handleDelete(id)` | No try/catch; delete failure is completely silent (M13) |
| `components/Navbar.tsx:~20` | `handleSignOut()` | No try/catch; sign-out failure gives no feedback (M14) |
| `app/dashboard/page.tsx:~200` | `handleCopyShareUrl()` | `navigator.clipboard.writeText().then(...)` with no `.catch()` |

### Missing Error States

| Component | Issue |
|---|---|
| Career page — GitHub evidence step | No error state variable when repos fetch fails during evidence build |
| Dashboard — delete | No error handling at all |
| Portfolio view — PDF export | Error state replaces entire portfolio view with error message |

### API Error Handling

| Route | Auth | Rate Limit | Retry | Input Validation |
|---|---|---|---|---|
| `/api/gemini` | ❌ None | ❌ None | ❌ None | ❌ None (type only) |
| `/api/resume` | ❌ None | ❌ None | ✅ 3 retries with backoff | ✅ File type/size |
| `/api/github/repos` | ✅ Bearer token | ❌ None | ❌ None | ❌ None |
| `/api/auth/callback/github` | ❌ None | ❌ None | ❌ None | ❌ None |

---

## 20. SEO Audit

| Severity | Finding | Detail |
|----------|---------|--------|
| **HIGH** | No `app/robots.ts` | No crawl directives; search engines can index `/dashboard`, `/builder`, `/api` |
| **HIGH** | No `app/sitemap.ts` | No sitemap; public portfolios not discoverable |
| **HIGH** | No per-page metadata | Only root layout has title "CareerProof AI"; all pages share it |
| **HIGH** | Zero Open Graph tags | No `og:title`, `og:description`, `og:image`; no social sharing previews |
| **HIGH** | Zero Twitter Card tags | No `twitter:card`, `twitter:title`, `twitter:description` |
| **HIGH** | No favicon or app icons | `public/` directory does not exist; Next.js serves default logo |
| **HIGH** | Dynamic portfolio/profile pages lack `generateMetadata` | Each public portfolio/profile should have its own title/OG tags |
| **MEDIUM** | No title template pattern | Root metadata uses static string; no `%s | CareerProof AI` template |
| **MEDIUM** | No canonical URLs | No `alternates: { canonical }` on any page |
| **MEDIUM** | No `app/manifest.ts` | No PWA support |
| **MEDIUM** | No `generateStaticParams` for portfolio pages | Dynamic routes are entirely client-rendered; search engines may not index |

---

## 21. Firestore Collection / Data Model Map

| Collection | Purpose | Key Fields | Owner | Read | Write | Rules Cover It? | Actually Used? |
|------------|---------|------------|-------|------|-------|------------------|----------------|
| `careerProfiles` | Career profile data | `userId`, `professionalTitle`, `careerSummary`, `targetRole`, `targetRoles`, `skills`, `githubConnection`, `overallReadiness`, `strengthsSummary`, `gapsSummary` | `userId` | Owner only | Owner only | ✅ | ✅ Active |
| `careerEvidence` | Derived evidence records | `userId`, `skill`, `sourceType`, `sourceId`, `sourceTitle`, `evidenceText`, `evidenceStrength` | `userId` | Owner only | Owner only | ✅ | ✅ Active |
| `githubTokens` | GitHub OAuth access tokens | `accessToken`, `updatedAt` | Doc ID = `userId` | Server-only (Admin SDK) | Server-only (Admin SDK) | ✅ | ✅ Active |
| `portfolios` | Portfolio documents | `userId`, `name`, `template`, `about`, `skills`, `projects`, `experience`, `education`, `isPublic`, `createdAt` | `userId` | Owner + public if `isPublic` | Owner only | ✅ | ✅ Active |
| `careerSkills` | (Schema defined, no code uses it) | — | — | — | — | ✅ Rules exist | ❌ Dead |
| `careerGaps` | (Schema defined, no code uses it) | — | — | — | — | ✅ Rules exist | ❌ Dead |
| `careerRecommendations` | (Schema defined, no code uses it) | — | — | — | — | ✅ Rules exist | ❌ Dead |

**Note:** Skill intelligence, evidence intelligence, gap analysis, and recommendations are all **computed client-side** from `careerProfiles` + `careerEvidence`. They are NOT persisted to Firestore. Collections 5-7 have security rules but zero application code references.

---

## 22. Dead Code / Duplicate UI Findings

### Dead Code

| Item | Location | Evidence |
|---|---|---|
| `generateHighlights` function | `lib/gemini.ts:64-69` | Exported but zero UI call sites (M16) |
| `PortfolioPreview.tsx` component | `components/builder/PortfolioPreview.tsx` | Builder uses `components/Preview.tsx` instead |
| `bannerUrl`, `skillDetails`, `socialLinks`, `achievements` fields | `types/portfolio.ts:63-69` | Never read or written |
| `Skill`, `SocialLink` types | `types/portfolio.ts:51-57` | Defined but never used outside type file |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` env var | `.env.local` | RTDB URL; app only uses Firestore |
| `careerSkills`, `careerGaps`, `careerRecommendations` Firestore collections | `firestore.rules` | Rules exist but no code reads/writes them |

### Duplicate Logic

| What | Location A | Location B |
|---|---|---|
| Portfolio save (addDoc/updateDoc) | `app/builder/page.tsx` | `app/dashboard/page.tsx` |
| Portfolio Firestore subscription | `app/builder/page.tsx` | `app/career/page.tsx` |
| Empty portfolio/project/experience/education factories | `app/builder/page.tsx` | `app/dashboard/page.tsx` |
| Markdown code-fence stripping + JSON parse | `app/api/gemini/route.ts` | 6 validation engines each have their own `parseXxxResponse` |
| CollapsibleSection component | `app/dashboard/page.tsx` (inline) | `components/career/CollapsibleSection.tsx` |

### Duplicate Dependencies
- `@google/generative-ai` (v0.24.1) used by `app/api/gemini/route.ts`
- `@google/genai` (v2.15.0) used by `app/api/resume/route.ts`

---

## 23. 4-Phase 30-Item Action Plan

### Phase 1: Security & Auth (Days 1-2)

1. **Create `.gitignore`** — `node_modules/`, `.next/`, `.env.local`, `.env*.local`, `*.tsbuildinfo`
2. **Rotate all secrets** — If `.env.local` was ever committed, regenerate Firebase service account key, GitHub client secret, Gemini API key
3. **Add auth verification to `/api/gemini` and `/api/resume`** — Copy the `adminAuth.verifyIdToken()` pattern from `/api/github/repos/route.ts`. Accept ID token from `Authorization: Bearer` header. Return 401 if invalid.
4. **Fix GitHub OAuth CSRF** — Generate random nonce, store in `state` alongside UID (e.g., `state = ${nonce}:${uid}`), set nonce in a secure/HttpOnly cookie. In callback, verify nonce from cookie matches the nonce in `state`, then extract UID.
5. **Fix `.firebaserc` default project** — Update to `ai-portfolio-builder-ba722`
6. **Add `middleware.ts`** — Protect `/dashboard`, `/career`, `/builder` routes server-side. Verify session cookie or redirect to `/login`.

### Phase 2: Core Functionality (Days 3-4)

7. **Configure Firebase Admin env vars** — Add `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` to `.env.local`
8. **Fix GitHub disconnect** — Delete `githubTokens/{userId}` doc, call GitHub token revocation endpoint (`DELETE /applications/{client_id}/token`)
9. **Fix public profile rendering** — Render skills, projects, experience, education, readiness scores, and link to full portfolio
10. **Fix public profile Firestore rules** — Add `isPublic` field to `careerProfiles` and update rules to allow unauthenticated reads when `isPublic == true`; same for `careerEvidence`
11. **Create `firestore.indexes.json`** — Define composite index on `careerEvidence` for `(userId, sourceType)`
12. **Fix template registry** — Either build 3 more unique templates or collapse to 3 honest labels (Minimal, Modern, Professional)
13. **Fix target role desync** — When AI recommends a role, add it to `targetRoles[]` and sync the dropdown

### Phase 3: SEO & UX Polish (Days 5-6)

14. **Create `app/robots.ts`** — Disallow private routes, allow public routes
15. **Create `app/sitemap.ts`** — List public portfolio/profile URLs
16. **Add per-page metadata** — `metadata` exports on every route; `generateMetadata` for dynamic routes
17. **Add Open Graph / Twitter Card metadata** — Root layout + page-level
18. **Add favicon and app icons** — `public/favicon.ico`, `apple-touch-icon.png`, `og-image.png`
19. **Fix dead footer links** — Remove or link to real pages
20. **Fix dead NextBestAction buttons** — Add onClick handlers or remove them (H8)
21. **Add delete confirmation dialog** — Dashboard portfolio deletion (H9)
22. **Add dashboard empty/onboarding state** — Match career page quality
23. **Eliminate duplicate Blueprint/Roadmap rendering** — Career page: choose inline OR ProjectExplorer, not both (H10)
24. **Unify color system** — Pick `slate` or `stone`; pick `indigo` or `amber` as accent

### Phase 4: Hardening & Polish (Days 7-8)

25. **Add rate limiting to API routes** — Simple IP-based or UID-based throttle
26. **Add input validation to API routes** — Validate `type`, `input`, `userId` with type checks and max-length limits
27. **Fix `ProtectedRoute` unconfigured Firebase case** — Redirect to error page, not silent allow
28. **Fix `adminDb` null-cast** — Export as `Firestore | null` and throw descriptive error at usage
29. **Remove dead code** — `PortfolioPreview.tsx`, `generateHighlights`, dead Firestore rules, unused type fields
30. **Verify `gemini-3.6-flash` model name** — Confirm it maps to a valid API model, or update default

---

## 24. Final Deployment Blockers

| # | Blocker | Severity | Blocking? |
|---|---------|----------|-----------|
| 1 | No `.gitignore` — secrets exposed in repo | CRITICAL | Yes — rotate all secrets before deploy |
| 2 | Unauthenticated `/api/gemini` and `/api/resume` | CRITICAL | Yes — unlimited API cost exposure |
| 3 | GitHub OAuth CSRF vulnerability | CRITICAL | Yes — account takeover risk |
| 4 | Firebase Admin credentials not configured | HIGH | Yes — server features won't work |
| 5 | `.firebaserc` points to wrong project | HIGH | Yes — Firestore rules deploy to wrong project |
| 6 | Missing composite Firestore index | HIGH | Yes — public profile query fails at runtime |
| 7 | `gemini-3.6-flash` model may not exist | HIGH | Yes — all Gemini features break if invalid |
| 8 | No `robots.ts` / `sitemap.ts` | HIGH | Yes — search engines index private routes |
| 9 | Public profile non-functional | HIGH | Yes — core product value for recruiters |
| 10 | GitHub OAuth callback URL must be production URL | MEDIUM | Yes — OAuth flow breaks if not registered |

---

## 25. Recommended Implementation Order

| Priority | Item | Phase | Depends On |
|----------|------|-------|------------|
| P0 | Create `.gitignore` + rotate secrets | 1 | None |
| P0 | Add auth to `/api/gemini` and `/api/resume` | 1 | Firebase Admin working |
| P0 | Fix GitHub OAuth CSRF | 1 | None |
| P0 | Fix `.firebaserc` default project | 1 | None |
| P1 | Configure Firebase Admin env vars | 2 | Service account JSON |
| P1 | Add `middleware.ts` for route protection | 1 | Firebase Admin working |
| P1 | Fix GitHub disconnect (delete + revoke token) | 2 | Firebase Admin working |
| P1 | Create `firestore.indexes.json` | 2 | None |
| P1 | Fix `gemini-3.6-flash` model name | 2 | None |
| P2 | Fix public profile rendering + Firestore rules | 2 | Composite index |
| P2 | Fix template registry | 2 | None |
| P2 | Fix target role desync | 2 | None |
| P2 | Create `robots.ts` + `sitemap.ts` | 3 | None |
| P2 | Add per-page metadata + OG tags | 3 | None |
| P2 | Fix dead footer links | 3 | None |
| P2 | Fix dead NextBestAction buttons | 3 | None |
| P2 | Add delete confirmation dialog | 3 | None |
| P2 | Eliminate duplicate Blueprint/Roadmap rendering | 3 | None |
| P2 | Add favicon/app icons | 3 | None |
| P3 | Unify color system | 3 | Design decision |
| P3 | Add dashboard empty/onboarding state | 3 | None |
| P3 | Add rate limiting + input validation | 4 | None |
| P3 | Fix `ProtectedRoute` + `adminDb` null-cast | 4 | None |
| P3 | Remove dead code | 4 | None |
| P3 | Add `aria-expanded` + label associations | 4 | None |
| P3 | Fix `classifyEvidenceLevel` "strong" cap | 4 | None |
| P3 | Fix misleading JSON parse error | 4 | None |
| P3 | Remove dual recommendation system | 4 | None |
| P3 | Add `error.tsx` / `not-found.tsx` | 4 | None |
| P3 | Configure `MotionConfig reducedMotion="user"` | 4 | None |

---

*Audit complete. No files were modified during this audit.*
