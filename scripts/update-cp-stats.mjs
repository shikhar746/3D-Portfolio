// Refreshes src/data/cp-stats.json from the public LeetCode and Codeforces APIs.
// Usage: npm run update-stats   (exits non-zero and leaves the file untouched if any request fails)
import { readFile, writeFile } from 'node:fs/promises';

const file = new URL('../src/data/cp-stats.json', import.meta.url);
const stats = JSON.parse(await readFile(file, 'utf8'));
const lcUser = stats.leetcode.handle, cfUser = stats.codeforces.handle;

async function json(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

// Codeforces: profile, accepted submissions (unique problems) and rated contests
const cfInfo = (await json(`https://codeforces.com/api/user.info?handles=${cfUser}`)).result[0];
const cfStatus = (await json(`https://codeforces.com/api/user.status?handle=${cfUser}`)).result;
const cfRating = (await json(`https://codeforces.com/api/user.rating?handle=${cfUser}`)).result;
const solved = new Set(cfStatus.filter((s) => s.verdict === 'OK')
  .map((s) => `${s.problem.contestId ?? s.problem.problemsetName}-${s.problem.index}`));

// LeetCode: accepted problems by difficulty
const lc = await json('https://leetcode.com/graphql', {
  method: 'POST',
  headers: { 'content-type': 'application/json', referer: `https://leetcode.com/u/${lcUser}/` },
  body: JSON.stringify({
    query: 'query($u:String!){ matchedUser(username:$u){ submitStatsGlobal{ acSubmissionNum{ difficulty count } } } }',
    variables: { u: lcUser }
  })
});
const user = lc.data && lc.data.matchedUser;
if (!user) throw new Error(`LeetCode user ${lcUser} not found`);
const ac = Object.fromEntries(user.submitStatsGlobal.acSubmissionNum.map((d) => [d.difficulty, d.count]));

const next = {
  ...stats,
  updated: new Date().toISOString().slice(0, 10),
  leetcode: { ...stats.leetcode, solved: ac.All, easy: ac.Easy, medium: ac.Medium, hard: ac.Hard },
  codeforces: {
    ...stats.codeforces,
    rating: cfInfo.rating ?? 0, maxRating: cfInfo.maxRating ?? 0,
    rank: cfInfo.rank ?? 'unrated', maxRank: cfInfo.maxRank ?? 'unrated',
    solved: solved.size, contests: cfRating.length
  }
};
await writeFile(file, JSON.stringify(next, null, 2) + '\n');
console.log('cp stats updated:', JSON.stringify({ leetcode: next.leetcode.solved, codeforces: next.codeforces.maxRating }));
