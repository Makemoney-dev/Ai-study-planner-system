const StudyPlan = require('../models/StudyPlan');
const { Flashcard } = require('../models/Session');
const User = require('../models/User');

// Helper: Call Anthropic Claude API
async function callClaude(messages, systemPrompt, maxTokens = 2048) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    // Return mock data for demo mode
    return null;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'AI API error');
  }

  const data = await response.json();
  return data.content[0].text;
}

// POST /api/ai/generate-study-plan
exports.generateStudyPlan = async (req, res) => {
  try {
    const { subjects, examDate, dailyHours, title } = req.body;

    if (!subjects || !examDate || !dailyHours) {
      return res.status(400).json({ success: false, message: 'subjects, examDate, and dailyHours are required' });
    }

    const today = new Date();
    const exam = new Date(examDate);
    const daysUntilExam = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExam <= 0) {
      return res.status(400).json({ success: false, message: 'Exam date must be in the future' });
    }

    const systemPrompt = `You are an expert study planner AI. Create detailed, personalized study plans. Always respond with valid JSON only, no extra text.`;
    
    const userMessage = `Create a study plan for these subjects: ${JSON.stringify(subjects)}.
Exam date: ${examDate} (${daysUntilExam} days from today: ${today.toISOString().split('T')[0]})
Daily study hours available: ${dailyHours}

Return a JSON object with:
{
  "planTitle": "string",
  "overview": "string - 2-3 sentences",
  "learningStrategies": ["strategy1", "strategy2", "strategy3", "strategy4", "strategy5"],
  "weeklyPlan": [
    {
      "week": 1,
      "theme": "string",
      "focus": ["subject1", "subject2"],
      "dailyBreakdown": {
        "Monday": [{"subject": "string", "topic": "string", "duration": 60, "type": "study|revision|practice"}],
        "Tuesday": [...],
        "Wednesday": [...],
        "Thursday": [...],
        "Friday": [...],
        "Saturday": [...],
        "Sunday": [{"type": "break", "activity": "light review"}]
      }
    }
  ],
  "revisionSchedule": "string",
  "motivationalTip": "string",
  "difficultyAnalysis": [{"subject": "string", "recommendedHours": number, "priority": "high|medium|low"}]
}

Keep it to ${Math.min(daysUntilExam > 7 ? 4 : 1, 4)} weeks.`;

    let aiResponse = await callClaude([{ role: 'user', content: userMessage }], systemPrompt, 3000);

    let parsedPlan;
    if (aiResponse) {
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        parsedPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse);
      } catch(e) {
        parsedPlan = getMockStudyPlan(subjects, daysUntilExam, dailyHours);
      }
    } else {
      parsedPlan = getMockStudyPlan(subjects, daysUntilExam, dailyHours);
    }

    // Save to DB
    const studyPlan = await StudyPlan.create({
      user: req.user.id,
      title: title || parsedPlan.planTitle || `Study Plan - ${new Date().toLocaleDateString()}`,
      subjects: subjects.map(s => ({
        name: s.name,
        difficulty: s.difficulty || 'medium',
        hoursNeeded: parsedPlan.difficultyAnalysis?.find(d => d.subject === s.name)?.recommendedHours || dailyHours,
        color: s.color || '#6366f1'
      })),
      examDate: exam,
      dailyAvailableHours: dailyHours,
      aiSuggestions: parsedPlan.overview,
      learningStrategies: parsedPlan.learningStrategies || []
    });

    res.json({
      success: true,
      plan: parsedPlan,
      savedPlan: studyPlan,
      daysUntilExam
    });

  } catch (error) {
    console.error('Study plan error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error generating study plan' });
  }
};

// POST /api/ai/chat
exports.chat = async (req, res) => {
  try {
    const { message, conversationHistory = [], context = '' } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const systemPrompt = `You are StudyBot, an expert AI study assistant. You help students with:
- Explaining complex topics in simple terms
- Creating quiz questions and practice problems
- Summarizing notes and content
- Providing study strategies and tips
- Generating mnemonics and memory aids
- Answering subject-specific questions

${context ? `Current context: ${context}` : ''}

Be encouraging, clear, and concise. Format responses with markdown when helpful.`;

    const messages = [
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    let aiResponse = await callClaude(messages, systemPrompt, 1500);

    if (!aiResponse) {
      aiResponse = getMockChatResponse(message);
    }

    res.json({ success: true, response: aiResponse });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, message: 'AI chat error: ' + error.message });
  }
};

// POST /api/ai/flashcards
exports.generateFlashcards = async (req, res) => {
  try {
    const { topic, subject, count = 10, difficulty = 'medium' } = req.body;

    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required' });
    }

    const systemPrompt = `You are an expert educational content creator. Generate high-quality flashcards. Respond with valid JSON only.`;

    const userMessage = `Create ${count} flashcards about "${topic}" for ${subject || 'general study'}.
Difficulty level: ${difficulty}

Return JSON:
{
  "cards": [
    {"front": "question or term", "back": "answer or definition", "difficulty": "easy|medium|hard"},
    ...
  ]
}`;

    let aiResponse = await callClaude([{ role: 'user', content: userMessage }], systemPrompt, 2000);

    let cards;
    if (aiResponse) {
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse);
        cards = parsed.cards;
      } catch(e) {
        cards = getMockFlashcards(topic, count);
      }
    } else {
      cards = getMockFlashcards(topic, count);
    }

    // Save flashcards
    const flashcard = await Flashcard.create({
      user: req.user.id,
      subject: subject || 'General',
      topic,
      cards,
      aiGenerated: true
    });

    res.json({ success: true, flashcards: flashcard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ai/flashcards
exports.getFlashcards = async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ user: req.user.id }).sort('-createdAt');
    res.json({ success: true, flashcards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ai/summarize
exports.summarize = async (req, res) => {
  try {
    const { text, style = 'concise' } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

    const systemPrompt = `You are an expert at summarizing educational content. Create clear, well-structured summaries.`;
    const userMessage = `Summarize this content in a ${style} style. Use bullet points and clear headings:\n\n${text}`;

    let summary = await callClaude([{ role: 'user', content: userMessage }], systemPrompt, 1000);
    if (!summary) summary = `**Summary of your notes:**\n\n• Key point 1 from your content\n• Key point 2 from your content\n• Main concepts identified\n\n*Note: Connect your AI API key in .env for full AI-powered summaries.*`;

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ai/motivation
exports.getMotivation = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const messages = [
      `🔥 Every expert was once a beginner. Your streak of ${user.stats.currentStreak} days shows your dedication, ${user.name}!`,
      `⚡ Success is the sum of small efforts repeated day in and day out. Keep pushing, ${user.name}!`,
      `🚀 You've studied ${Math.round(user.stats.totalHoursStudied)} hours total. That's incredible progress!`,
      `💡 The secret to getting ahead is getting started. You're already winning by being here!`,
      `🌟 Believe you can and you're halfway there. Your hard work will pay off!`,
      `📚 Knowledge is power. Every page you read, every problem you solve makes you stronger!`,
      `🎯 Focus on progress, not perfection. You're doing amazing, ${user.name}!`,
      `💪 Champions aren't made in gyms. They're made from something they have deep inside — a desire, a dream, a vision.`,
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching motivation' });
  }
};

// Mock data for demo mode (no API key)
function getMockStudyPlan(subjects, days, hours) {
  return {
    planTitle: `${days}-Day Study Plan`,
    overview: `This personalized study plan covers ${subjects.map(s => s.name).join(', ')} over ${days} days with ${hours} hours per day. The plan progressively builds understanding from fundamentals to advanced topics.`,
    learningStrategies: [
      "Use active recall and spaced repetition for better retention",
      "Practice with past exam papers in the final week",
      "Create mind maps to connect concepts visually",
      "Take regular breaks using the Pomodoro technique",
      "Teach concepts to yourself out loud to test understanding"
    ],
    weeklyPlan: [{
      week: 1,
      theme: "Foundation Building",
      focus: subjects.map(s => s.name),
      dailyBreakdown: {
        Monday: subjects.map(s => ({ subject: s.name, topic: "Introduction & Core Concepts", duration: Math.floor((hours * 60) / subjects.length), type: "study" })),
        Tuesday: subjects.map(s => ({ subject: s.name, topic: "Key Theories & Principles", duration: Math.floor((hours * 60) / subjects.length), type: "study" })),
        Wednesday: subjects.map(s => ({ subject: s.name, topic: "Practice Problems", duration: Math.floor((hours * 60) / subjects.length), type: "practice" })),
        Thursday: subjects.map(s => ({ subject: s.name, topic: "Deep Dive Topics", duration: Math.floor((hours * 60) / subjects.length), type: "study" })),
        Friday: [{ subject: "All", topic: "Weekly Revision & Review", duration: hours * 60, type: "revision" }],
        Saturday: subjects.map(s => ({ subject: s.name, topic: "Mock Test & Self-Assessment", duration: Math.floor((hours * 60) / subjects.length), type: "practice" })),
        Sunday: [{ type: "break", activity: "Light review and rest" }]
      }
    }],
    revisionSchedule: "Revise each topic after 1 day, then 3 days, then 1 week using spaced repetition",
    motivationalTip: "You've got this! Break it down into small, manageable chunks and celebrate each milestone.",
    difficultyAnalysis: subjects.map(s => ({
      subject: s.name,
      recommendedHours: hours * 0.3,
      priority: s.difficulty === 'hard' ? 'high' : s.difficulty === 'medium' ? 'medium' : 'low'
    }))
  };
}

function getMockChatResponse(message) {
  const lower = message.toLowerCase();
  if (lower.includes('quiz') || lower.includes('question')) {
    return `Here are some practice questions:\n\n**Q1:** What is the main concept you're studying?\n**Q2:** Can you explain it in simple terms?\n**Q3:** How does it apply in real-world scenarios?\n\n*💡 Tip: Connect your Anthropic API key in the .env file for full AI-powered responses!*`;
  }
  if (lower.includes('explain') || lower.includes('what is')) {
    return `Great question! Here's a breakdown:\n\n**Key Points:**\n• Start with the fundamentals\n• Build understanding step by step\n• Connect new info to what you already know\n\n**Study Tip:** Use the Feynman Technique — explain it as if teaching a 5-year-old!\n\n*Connect your API key for detailed AI explanations.*`;
  }
  if (lower.includes('summarize') || lower.includes('summary')) {
    return `**Summary Framework:**\n\n1. **Main Idea** — The core concept\n2. **Key Points** — 3-5 supporting ideas\n3. **Examples** — Real-world applications\n4. **Connections** — How it links to other topics\n\n*Add your Anthropic API key for AI-powered summaries of your actual content!*`;
  }
  return `I'm StudyBot, your AI study assistant! 🤖\n\nI can help you with:\n• **Explaining topics** — Just ask "Explain [topic]"\n• **Creating quizzes** — Ask "Create a quiz on [subject]"\n• **Summarizing notes** — Share your notes and I'll summarize\n• **Study strategies** — Ask for tips on any subject\n\n*Note: Add your Anthropic API key to .env for full AI capabilities!*`;
}

function getMockFlashcards(topic, count) {
  const cards = [];
  for (let i = 1; i <= Math.min(count, 5); i++) {
    cards.push({
      front: `What is a key concept #${i} in ${topic}?`,
      back: `This is a key definition or explanation for concept #${i}. Connect your API key for real AI-generated flashcards!`,
      difficulty: i <= 2 ? 'easy' : i <= 4 ? 'medium' : 'hard'
    });
  }
  return cards;
}
