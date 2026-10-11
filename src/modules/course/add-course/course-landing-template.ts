import type { CourseLandingContent, LandingRoadmapWeek } from "./add-course.types";

/** Placeholders the public page fills in. Shown to the admin as a hint. */
export const LANDING_PLACEHOLDERS = [
  { token: "{price}", description: "price right now, e.g. ₹1,499" },
  { token: "{originalPrice}", description: "full price, e.g. ₹2,999" },
  { token: "{discount}", description: "discount right now, e.g. 50" },
  { token: "{launchDate}", description: "day the course opens, e.g. 12 Oct 2026" },
  { token: "{offerEndDate}", description: "last day of the prelaunch offer" },
  { token: "{courseTitle}", description: "the course title" },
  { token: "{lessonCount}", description: "number of lessons, e.g. 30" },
  { token: "{totalDuration}", description: "length of all lessons together, e.g. 1h 32m" },
] as const;

/** Roadmap weeks for the "What you'll get" section; also offered to courses saved before weeks existed. */
export const ROADMAP_WEEKS_TEMPLATE: LandingRoadmapWeek[] = [
  {
    title: "Week 1: Build the foundation",
    text: "Learn how flexibility actually works and begin strengthening the muscles that support safe range of motion.",
    pointsTitle: "By the end of week 1:",
    points: [
      "You'll know exactly why you've been tight in the same places for years",
      "A forward fold that comes from your hips, not your lower back",
      "Hamstrings that lengthen instead of gripping back",
    ].join("\n"),
    imageUrl: "",
    imageId: "",
  },
  {
    title: "Week 2: Strengthen your stretches",
    text: "Develop active flexibility by building strength at end ranges, helping your body feel safe to open.",
    pointsTitle: "By the end of week 2:",
    points: [
      "Lift your leg higher without using your hands",
      "Hold a shape at your end range instead of collapsing into it",
      "Stretches that hold overnight instead of resetting by morning",
    ].join("\n"),
    imageUrl: "",
    imageId: "",
  },
  {
    title: "Week 3: Expand range with control",
    text: "Increase mobility through controlled, intentional movement instead of forcing depth.",
    pointsTitle: "By the end of week 3:",
    points: [
      "Visibly more depth in hips, hamstrings and shoulders",
      "Getting into deep shapes without bracing for pain",
      "Confidence to go further because you're strong there",
    ].join("\n"),
    imageUrl: "",
    imageId: "",
  },
  {
    title: "Week 4: Integrate and maintain",
    text: "Bring strength and flexibility together so your progress feels stable, repeatable and sustainable.",
    pointsTitle: "By the end of week 4:",
    points: [
      "A short maintenance routine that keeps your range",
      "Range that stays with you between sessions",
      "A clear plan for what to work on next",
    ].join("\n"),
    imageUrl: "",
    imageId: "",
  },
];
export const ROADMAP_BUTTON_TEMPLATE = "I want to train this way → {price}";
export const ROADMAP_EYEBROW_TEMPLATE = "Your 4-week roadmap";
export const ROADMAP_NOTE_TEMPLATE =
  "Everyone's body is different. Go at your own pace, and check with your doctor first if you have an injury or health condition.";

export const EMPTY_LANDING_CONTENT: CourseLandingContent = {
  announcement: { prelaunch: "", live: "" },
  hero: {
    badge: { prelaunch: "", live: "" },
    title: "",
    subtitle: "",
    countdownLabel: "",
    primaryButton: "",
    secondaryButton: "",
    chips: [],
    coverImageUrl: "",
    coverImageId: "",
  },
  trailerSection: { title: "", text: "" },
  statsTitle: "",
  stats: [],
  painPoints: { title: "", text: "", items: [] },
  howItWorks: { title: "", text: "", steps: [] },
  benefits: {
    eyebrow: "",
    title: "",
    text: "",
    weeks: [],
    button: "",
    note: "",
  },
  curriculum: { title: "", text: "" },
  pricing: {
    title: "",
    text: { prelaunch: "", live: "" },
    badge: { prelaunch: "", live: "" },
    stepsTitle: "",
    steps: { prelaunch: [], live: [] },
    features: [],
    button: "",
    note: "",
  },
  instructor: {
    title: "",
    bio: "",
    imageUrl: "",
    imageId: "",
    stats: [],
    availability: "",
    teachesLabel: "",
    teaches: [],
    quote: { text: "", author: "" },
    primaryButton: { label: "", url: "" },
    secondaryButton: { label: "", url: "" },
    buttonNote: "",
  },
  testimonials: { title: "", showScreenshots: false, quotes: [] },
  faq: { title: "", text: "", items: [] },
  finalCta: { title: "", text: "", button: "" },
  mobileBar: { subtitle: "" },
  seo: { title: "", description: "", imageUrl: "", imageId: "" },
};

/**
 * Starting copy for a new landing page, taken from the course page design. Loaded when a course has
 * no landing content yet; the admin edits it for the course before saving.
 */
export const LANDING_CONTENT_TEMPLATE: CourseLandingContent = {
  announcement: {
    prelaunch: "🎉 Pre-launch offer: *Flat {discount}% off* until {offerEndDate} · Course opens on *{launchDate}*",
    live: "🎉 The course is live! Start Day 1 today",
  },
  hero: {
    badge: { prelaunch: "🌿 New course · Launching soon", live: "🌿 New course · Now live" },
    title: "30 Days to *Full Mobility*",
    subtitle:
      "A gentle, structured daily practice to unlock your hips, spine and shoulders, so you can move, sit and squat without stiffness. Just click and play.",
    countdownLabel: "Pre-launch offer ({discount}% off) ends in",
    primaryButton: "Start the 30 days · {price}",
    secondaryButton: "See what's inside",
    chips: ["🧘 Beginner friendly", "⏱ 10–12 min / day"],
    coverImageUrl: "",
    coverImageId: "",
  },
  trailerSection: {
    title: "See what *30 days* feels like",
    text: "A short look at the sessions, the pace and the guidance you'll follow every day.",
  },
  statsTitle: "Course at a glance",
  stats: [
    { icon: "📅", iconUrl: "", iconId: "", title: "30 Days", text: "Daily guided practice" },
    { icon: "⏱", iconUrl: "", iconId: "", title: "10–12 Mins", text: "One short video a day" },
    { icon: "🎥", iconUrl: "", iconId: "", title: "30 Videos", text: "A new focus every day" },
    { icon: "♾", iconUrl: "", iconId: "", title: "Lifetime", text: "Access, no expiry" },
    { icon: "📱", iconUrl: "", iconId: "", title: "Any Device", text: "Phone, tablet or TV" },
    { icon: "🌱", iconUrl: "", iconId: "", title: "All Levels", text: "Beginner friendly" },
  ],
  painPoints: {
    title: "Stiffness shouldn't be your *normal*.",
    text: "Long hours at a desk, on your phone or in the car add up. If any of these sound like you, this course was made for you.",
    items: [
      {
        icon: "🪑",
        iconUrl: "",
        iconId: "",
        title: "Stuck from sitting",
        text: "Hours at a desk leave your hips tight and your lower back aching by evening.",
      },
      {
        icon: "🦵",
        iconUrl: "",
        iconId: "",
        title: "Can't get into the poses",
        text: "Squatting, sitting cross-legged or reaching your toes feels like a struggle.",
      },
      {
        icon: "🔁",
        iconUrl: "",
        iconId: "",
        title: "No consistency",
        text: "Random YouTube videos don't build progress. You need a clear plan, day by day.",
      },
    ],
  },
  howItWorks: {
    title: "Simple enough to do *every day*",
    text: "No complicated routines. Just press play and follow along, one short session at a time.",
    steps: [
      { title: "Press play", text: "Open today's session on your phone, tablet or TV. No planning needed." },
      { title: "Follow along", text: "10–12 gentle minutes with clear voice guidance, at your own pace." },
      { title: "Feel the change", text: "Notice looser hips and an easier spine, week after week." },
    ],
  },
  benefits: {
    eyebrow: ROADMAP_EYEBROW_TEMPLATE,
    title: "Your flexibility roadmap",
    text: "A progressive system designed to help you improve flexibility while staying strong, supported, and injury-free.",
    weeks: ROADMAP_WEEKS_TEMPLATE,
    button: ROADMAP_BUTTON_TEMPLATE,
    note: ROADMAP_NOTE_TEMPLATE,
  },
  curriculum: {
    title: "{lessonCount} lessons. *{totalDuration} total.*",
    text: "Watch on your phone, tablet or TV — and come back to any lesson as many times as you like.",
  },
  pricing: {
    title: "Everything you need, *one price*.",
    text: {
      prelaunch:
        "One payment, lifetime access. The {discount}% pre-launch price ends when the course opens on {launchDate}.",
      live: "One payment, lifetime access. Start Day 1 today.",
    },
    badge: { prelaunch: "🎉 Pre-launch offer · Flat {discount}% off", live: "🎉 Launch offer · {discount}% off" },
    stepsTitle: "How it works",
    steps: {
      prelaunch: ["Enroll now at *{discount}% off*", "Confirmation email, instantly", "Course unlocks *{launchDate}*"],
      live: ["Enroll now", "Get instant access after payment", "Start Day 1 today"],
    },
    features: [
      "30 daily videos, 10–12 min each",
      "Lifetime access, on phone, tablet or TV",
      "No equipment needed, just a mat",
      "Follow at your own pace",
      "Support from Kratika by email",
    ],
    button: "Enroll in the course",
    note: "One-time payment · lifetime access · no subscription",
  },
  instructor: {
    title: "Kratika *Saraswat*",
    bio: "A certified 500-Hour Yoga Teacher Training (YTT) graduate and Half Primary Ashtanga yoga coach. Practising yoga for 8 years and teaching for the last 5 — every course comes from lessons learned on her own mat first.",
    imageUrl: "",
    imageId: "",
    stats: [
      { value: "8 yrs", label: "of practice" },
      { value: "500 hr", label: "YTT certified" },
      { value: "5 yrs", label: "of teaching" },
      { value: "200+", label: "students taught" },
    ],
    availability: "Taking new students this month",
    teachesLabel: "She teaches",
    teaches: ["Ashtanga (Half Primary)", "Hatha", "Pranayama", "Beginner foundations", "Mobility & flexibility"],
    quote: {
      text: "Yoga meets you where you are. My job is to help you take the next honest step on your mat.",
      author: "Kratika",
    },
    // No booking link yet: the admin adds one (e.g. a Calendly or WhatsApp link) to show this button.
    primaryButton: { label: "Book a call with Kratika", url: "" },
    secondaryButton: { label: "View her courses", url: "/courses" },
    buttonNote: "Free 15-min intro call",
  },
  testimonials: {
    title: "Real practice. Real progress.",
    showScreenshots: true,
    quotes: [
      {
        text: "Clear guidance, thoughtful pacing and just the right amount of challenge. I feel more open every morning.",
        name: "Rohan Mehta",
      },
      {
        text: "I stopped worrying about doing every pose perfectly. The course helped me move with much more confidence.",
        name: "Meera Kapoor",
      },
      {
        text: "The sessions made yoga feel approachable and helped me build a practice I can stay consistent with.",
        name: "Ananya Sharma",
      },
    ],
  },
  faq: {
    title: "Questions before you begin?",
    text: "A few helpful answers to make your first step feel simple.",
    items: [
      {
        question: "Is this suitable for beginners?",
        answer: "Yes. Every session is paced gently with clear cues, and you can move at your own speed.",
      },
      {
        question: "How much time do I need each day?",
        answer: "Just 10–12 minutes. One short video a day, easy to fit in before work or at lunch.",
      },
      { question: "Do I need any equipment?", answer: "Just a mat." },
      { question: "How long do I have access?", answer: "Lifetime access, on your phone, tablet or TV." },
    ],
  },
  finalCta: {
    title: "Your body is ready. *Start day one.*",
    text: "Thirty days from now, you'll move differently.",
    button: "Enroll now",
  },
  mobileBar: { subtitle: "30 Days Full Mobility" },
  // Empty: the page uses the course title, intro text and cover image until the admin fills these in.
  seo: { title: "", description: "", imageUrl: "", imageId: "" },
};

const isBlank = (value: unknown): boolean =>
  value === "" ||
  value === false ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === "object" && value !== null && !Array.isArray(value) && Object.values(value).every(isBlank));

/** True when nothing has been written yet, so the starting template can be offered. */
export const isLandingContentEmpty = (content: CourseLandingContent) => isBlank(content);
