import { SampleCSVDataset, ToneOption } from '../types';

export const TONE_OPTIONS: ToneOption[] = [
  {
    id: 'casual',
    name: 'Casual & Friendly',
    description: 'Warm, approachable, like chatting with a friend over coffee.',
    iconName: 'Coffee',
    example: "Hey there! Let's talk about something that's been bugging a lot of creators lately..."
  },
  {
    id: 'conversational',
    name: 'Conversational Tech',
    description: 'Informative yet easy to digest. Tech concepts explained simply.',
    iconName: 'Zap',
    example: "If you've ever built an app, you know the pain of state management..."
  },
  {
    id: 'thought_leader',
    name: 'Thought Leader',
    description: 'Insightful, confident, authoritative without sounding arrogant.',
    iconName: 'Briefcase',
    example: "The shift in digital media isn't coming—it's already here. Here is what we learned..."
  },
  {
    id: 'storyteller',
    name: 'Narrative & Storyteller',
    description: 'Engaging narrative style with hooks, anecdotes, and emotional resonance.',
    iconName: 'BookOpen',
    example: "Last Tuesday at 2 AM, I stared at a blank screen wondering where it all went wrong..."
  },
  {
    id: 'punchy',
    name: 'Punchy & Witty',
    description: 'Short sentences, high energy, crisp bullet points, zero fluff.',
    iconName: 'Flame',
    example: "Stop overcomplicating your blog posts. Here's 3 rules that actually work."
  },
  {
    id: 'sarcastic',
    name: 'Opinionated & Snarky',
    description: 'Bold, humorous, mildly sarcastic with strong viewpoints.',
    iconName: 'Smile',
    example: "Great news: another generic AI newsletter just dropped. Here's why you should care (or not)."
  },
  {
    id: 'academic',
    name: 'In-Depth & Clear',
    description: 'Well-structured, articulate, precise, and educational without heavy jargon.',
    iconName: 'GraduationCap',
    example: "A comprehensive examination of content distribution models in 2026..."
  },
  {
    id: 'custom',
    name: 'Custom Persona Prompt',
    description: 'Write your own specific instructions or persona for the AI agent.',
    iconName: 'Slidert',
    example: "Act as a seasoned tech journalist writing for Wired with a subtle sense of humor."
  }
];

export const SAMPLE_DATASETS: SampleCSVDataset[] = [
  {
    id: 'tech_robotic',
    name: 'AI & Tech Articles (Robotic AI Drafts)',
    description: '5 blog drafts filled with cliché AI phrases like "delve into", "testament to", "in summary".',
    filename: 'ai_tech_blogs_raw.csv',
    rowsCount: 5,
    contentColumn: 'content',
    titleColumn: 'title',
    authorColumn: 'author',
    data: [
      {
        id: '1',
        title: 'Navigating the Evolving Landscape of Artificial Intelligence in 2026',
        author: 'AI Generator v4',
        category: 'Technology',
        keywords: 'AI, Machine Learning, Digital Transformation',
        content: `In today's rapidly evolving digital landscape, artificial intelligence has emerged as a game-changing paradigm shift. It is important to note that machine learning models serve as a testament to human innovation. Furthermore, in order to delve into the realm of modern technology, one must harness the power of neural networks.

Furthermore, it is worth noting that businesses must leverage AI solutions to supercharge productivity and foster seamless integration. Ultimately, navigating this digital revolution requires a holistic approach that seamlessly aligns strategy with cutting-edge tools. In conclusion, the future of AI is undeniably bright, serving as a beacon of possibilities for tomorrow's leaders.`
      },
      {
        id: '2',
        title: 'Mastering Remote Work: A Comprehensive Guide to Synergistic Productivity',
        author: 'Bot Writer Pro',
        category: 'Workplace',
        keywords: 'Remote Work, Productivity, Collaboration',
        content: `In the contemporary era of remote work, fostering seamless communication is paramount for organizational success. It goes without saying that remote teams face a plethora of challenges. However, by leveraging collaborative platforms, remote workers can unlock unprecedented levels of efficiency.

Delving deeper into this topic, one must consider the tapestry of asynchronous communication tools. In summary, optimizing work-from-home workflows is not merely an option, but a testament to modern flexibility. Therefore, it is imperative to implement structured daily standups to align team objectives.`
      },
      {
        id: '3',
        title: 'Unlocking the Power of Search Engine Optimization for Business Growth',
        author: 'ContentBot 9000',
        category: 'Marketing',
        keywords: 'SEO, Digital Marketing, Content Strategy',
        content: `In the fast-paced realm of digital marketing, Search Engine Optimization stands as a vital cornerstone. To delve into keyword optimization, one must understand the multifaceted nature of search algorithms. Furthermore, crafting compelling meta descriptions serves as a testament to high-quality content curation.

Additionally, backlink acquisition plays an indispensable role in supercharging domain authority. It is essential to remember that organic traffic growth is a marathon, not a sprint. In conclusion, adhering to SEO best practices unlocks endless horizons of digital visibility and customer engagement.`
      },
      {
        id: '4',
        title: 'Demystifying Cloud Architecture for Enterprise Solutions',
        author: 'TechWriter AI',
        category: 'Cloud Computing',
        keywords: 'Cloud, AWS, Microservices',
        content: `Cloud architecture represents a multifaceted ecosystem designed to streamline data management. In today's interconnected landscape, migrating to serverless infrastructures provides unprecedented scalability. Moreover, delving into container orchestration requires a meticulous understanding of microservice paradigms.

It is worth noting that cloud security must never be compromised. By implementing robust encryption standards, enterprises can safeguard critical assets against cyber threats. In summary, cloud adoption stands as a testament to modern technological resilience.`
      },
      {
        id: '5',
        title: 'The Essential Blueprint for Healthy Daily Living Habits',
        author: 'AutoContent AI',
        category: 'Wellness',
        keywords: 'Health, Nutrition, Wellness',
        content: `In our fast-paced modern society, maintaining optimal health is of utmost importance. To delve into daily wellness routines, one must first recognize the interconnectedness of nutrition, sleep, and physical exercise. Furthermore, staying hydrated serves as a fundamental pillar for holistic vitality.

Additionally, incorporating mindfulness meditation fosters emotional equilibrium. It goes without saying that small, consistent actions lead to transformative results over time. In conclusion, prioritizing self-care is a testament to living a balanced and fulfilling life.`
      }
    ]
  },
  {
    id: 'saas_marketing',
    name: 'SaaS & Marketing Blog Posts',
    description: '4 corporate SaaS blog drafts that need personality, flow, and engaging storytelling.',
    filename: 'saas_marketing_posts.csv',
    rowsCount: 4,
    contentColumn: 'body_text',
    titleColumn: 'post_title',
    authorColumn: 'writer',
    data: [
      {
        id: '101',
        post_title: 'Why Customer Churn is Killing Your Subscription Growth',
        writer: 'Marketer Bot',
        industry: 'SaaS',
        body_text: `Customer acquisition is expensive, but customer retention is where subscription businesses live or die. Many founders focus solely on top-of-funnel acquisition while leaking revenue through high churn rates. It is crucial to analyze customer lifecycle metrics to identify drop-off points early.

Furthermore, implementing proactive onboarding sequences and automated check-ins drastically reduces churn. In summary, retention is the ultimate lever for compounding ARR in any SaaS business.`
      },
      {
        id: '102',
        post_title: 'How to Build a High-Converting B2B Landing Page',
        writer: 'Copy AI Assistant',
        industry: 'Copywriting',
        body_text: `A landing page has one job: convert visitors into qualified leads. To achieve this, your headline must immediately state the value proposition within three seconds. Moreover, social proof such as customer testimonials and logos serves as a powerful trust builder.

Delving into call-to-action design, using high-contrast buttons and clear, action-oriented verbs increases conversion rates significantly. In conclusion, continuous A/B testing is essential for continuous growth.`
      },
      {
        id: '103',
        post_title: 'The Rise of Product-Led Growth (PLG) in Modern Software',
        writer: 'Growth AI',
        industry: 'SaaS',
        body_text: `Product-Led Growth shifts the user acquisition burden from traditional sales reps directly to the software product itself. By offering freemium tiers or interactive free trials, prospects experience value firsthand before committing financial resources.

It is worth noting that PLG requires seamless product onboarding and clear friction points that incentivize upgrades. Ultimately, software that sells itself achieves lower acquisition costs and faster viral expansion.`
      },
      {
        id: '104',
        post_title: 'Unlocking Higher Open Rates with Email Subject Line Psychology',
        writer: 'Email Bot',
        industry: 'Email Marketing',
        body_text: `Subject lines are the gatekeepers of your email marketing strategy. If users do not open your email, your meticulously written copy goes completely unseen. Utilizing curiosity gaps, urgency, and personalization dramatically boosts open rates.

Additionally, avoiding spam trigger words ensures deliverability into the primary inbox rather than the promotions tab. In conclusion, testing short versus long subject lines provides actionable insights for subscriber engagement.`
      }
    ]
  }
];
