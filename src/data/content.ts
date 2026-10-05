import type { CpStats, Profile, Project } from '../types';
import cpStats from './cp-stats.json';

export const NAME = 'SHIKHAR SRIVASTAVA';

export const CP: CpStats = cpStats;
export const CP_INTRO = 'I practise data structures and algorithms in C++: interview-style problems on LeetCode and rated contests on Codeforces.';

export const PROFILE: Profile = {
  role: 'full-stack developer // AI // competitive programming',
  about: 'Third-year Mechanical Engineering student at IIT Kharagpur. I build full-stack web apps with AI inside them, and I practise competitive programming.',
  edu: ['Indian Institute of Technology Kharagpur', 'B.Tech, Mechanical Engineering · third year', 'CGPA 8.28 / 10'],
  skills: [
    ['languages', ['C++', 'JavaScript', 'TypeScript', 'SQL']],
    ['web', ['React', 'Next.js', 'Node.js', 'Express', 'Tailwind CSS', 'Three.js']],
    ['data', ['PostgreSQL', 'Prisma', 'Supabase', 'Redis', 'pgvector']],
    ['ai', ['Claude API', 'OpenAI', 'Gemini', 'embeddings', 'tool use']],
    ['core', ['data structures & algorithms', 'competitive programming']]
  ]
};

export const ORDER = ['loop', 'minnerva', 'cloudstorage'] as const;

export const PROJECTS: Readonly<Record<string, Project>> = {
  loop: {
    num: '01', color: 'y', title: 'LOOP', tagline: 'AI customer-feedback intelligence',
    shot: 'assets/loop.webp',
    links: [['https://loop-psi-drab.vercel.app/', 'open live app ↗'], ['https://github.com/shikhar746/Loop', 'view source ↗']],
    overview: 'LOOP pulls in customer feedback from support tickets, app reviews, NPS surveys, sales notes and community threads. It classifies every item and spots rising themes. It also answers questions about the feedback, citing the customers who said it.',
    features: [
      'AI classification by sentiment, theme and feature area',
      'Theme trend tracking with spike detection',
      'Semantic search across all feedback',
      '"Ask LOOP": plain-English questions about the data',
      'Voice-of-Customer reports that can be generated and shared',
      'Multi-tenant workspaces with Viewer, Analyst and Admin roles'
    ],
    hood: [
      'Claude API with forced tool use and every response validated by Zod. Google Gemini is the fallback.',
      'Voyage AI embeddings stored in Supabase Postgres with pgvector for semantic search.',
      'Business logic lives in a service layer that enforces tenant isolation on every query.',
      'Covered by 127 unit tests and 28 smoke tests.'
    ],
    stack: [
      ['frontend', ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Recharts']],
      ['backend', ['Prisma 6', 'NextAuth v4', 'Supabase Postgres', 'pgvector']],
      ['ai', ['Claude API', 'Gemini', 'Voyage AI', 'Zod']],
      ['deploy', ['Vercel']]
    ]
  },
  minnerva: {
    num: '02', color: '', title: 'MINNERVA', tagline: 'AI-assisted multi-tenant learning management system',
    shot: 'assets/minnerva.webp',
    links: [['https://learning-management-system-kappa-one.vercel.app', 'open live app ↗'], ['https://github.com/shikhar746/Learning-Management-System', 'view source ↗']],
    overview: 'Instructors create workshop cohorts, assign tasks, grade submissions with AI assistance and issue certificates. Students join with access codes, submit versioned work, take part in moderated forums and track their progress.',
    features: [
      'Workshop cohorts with access-code enrolment',
      'Versioned task submissions',
      'AI-assisted grading with human review before release',
      'Moderated discussion forums',
      'Certificates generated from configurable templates',
      'Progress tracking for students'
    ],
    hood: [
      'Bring-your-own-key AI grading routed across 6 providers: Groq, OpenAI, Claude, Gemini, Kimi and Qwen.',
      'Two-level RBAC: platform roles (Owner, Admin, Student) plus workshop-scoped permissions, with strict data isolation between workshops.',
      'Stored API keys encrypted with AES-256-GCM. Zod validation and custom SSRF guards on outbound requests.',
      'Automated forum moderation pipeline, optionally backed by the OpenAI Moderation API.',
      'Upstash Redis caching with an in-memory fallback. Tests run on Node’s built-in node:test runner.'
    ],
    stack: [
      ['frontend', ['Next.js 16', 'React 19', 'Tailwind v4', 'shadcn/ui']],
      ['backend', ['Node.js', 'TypeScript', 'Prisma 5', 'NextAuth v5']],
      ['data', ['Neon Postgres', 'Upstash Redis', 'Cloudinary']],
      ['deploy', ['Vercel']]
    ]
  },
  cloudstorage: {
    num: '03', color: 'm', title: 'CLOUDSTORAGE', tagline: 'Full-stack cloud drive with sharing and trash recovery',
    term: '<span class="p">$</span> curl cloud-storage-api-hquw.onrender.com/api/health\n{\n' +
      '  <span class="k">"status"</span>: "ok",\n  <span class="k">"limits"</span>: {\n' +
      '    <span class="k">"maxFileSizeBytes"</span>: <span class="n">52428800</span>,\n' +
      '    <span class="k">"maxDirectUploadBytes"</span>: <span class="n">5368709120</span>\n  },\n' +
      '  <span class="k">"trashRetentionDays"</span>: <span class="n">30</span>\n}\n\n' +
      '<span class="note">// live response: 50 MB through the server, up to 5 GB direct to storage</span>',
    links: [['https://cloud-storage-api-hquw.onrender.com/api/health', 'api health ↗'], ['https://github.com/shikhar746/CloudStorage', 'view source ↗']],
    overview: 'A Drive-style platform. Users organise files in nested folders, share them with fine-grained permissions, publish public links and restore deleted items from a trash that empties itself automatically.',
    features: [
      'Nested folders and starred items',
      'Granular sharing, with permissions inherited from parent folders',
      'Public links with an optional password and expiry date',
      'Soft-delete trash that purges automatically after 30 days',
      'Google Sign-In'
    ],
    hood: [
      'A dual-path upload pipeline keeps large files out of server memory.',
      'One Render service serves both the API and the built React app, so session cookies stay first-party in every browser. This fixed the cookie failures of the original split deployment.',
      'Strict TypeScript, Zod validation, JWT sessions, bcrypt password hashing and rate limiting.'
    ],
    stack: [
      ['frontend', ['React 19', 'TypeScript', 'Vite 6', 'Tailwind CSS 4']],
      ['backend', ['Node.js 20', 'Express 5', 'Zod', 'multer', 'JWT']],
      ['data', ['Supabase Postgres', 'Supabase Storage']],
      ['deploy', ['Render']]
    ]
  }
};
