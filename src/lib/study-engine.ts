export const StudyEngine = {
  getFlashcardPrompt: (text: string) => `
You are a study assistant creating flashcards. Extract the most important concepts, terms, and facts from the provided text and turn them into flashcards.
Output your response ONLY as a JSON array of objects with "front" and "back" keys. Do not include any markdown formatting blocks like \`\`\`json.
Example format:
[
  { "front": "What is mitochondria?", "back": "The powerhouse of the cell." }
]

Text to analyze:
${text}
`,

  getQuizPrompt: (text: string, difficulty: string) => `
You are a study assistant creating a multiple-choice quiz. Based on the provided text, generate 3-5 multiple-choice questions at a ${difficulty} difficulty level.
Output your response ONLY as a JSON array of objects. Do not include any markdown formatting blocks like \`\`\`json.
Each object should have "question", "options" (array of 4 strings), "correctAnswer" (exact string from options), and "explanation".

Example format:
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": "Paris",
    "explanation": "Paris is the capital and most populous city of France."
  }
]

Text to analyze:
${text}
`,

  getSummaryPrompt: (text: string, style: 'brief' | 'detailed' | 'bullet' | 'eli5') => {
    let instruction = '';
    switch(style) {
      case 'brief': instruction = 'Provide a short, 1-2 paragraph summary capturing the main idea.'; break;
      case 'detailed': instruction = 'Provide a comprehensive summary covering the main topics and key supporting details.'; break;
      case 'bullet': instruction = 'Provide a bullet-point summary of the key takeaways.'; break;
      case 'eli5': instruction = 'Summarize the core concepts simply, as if explaining them to a 5-year-old. Use analogies where helpful.'; break;
    }

    return `
You are a study assistant summarizing a document. ${instruction}
Use markdown formatting where appropriate (bolding, headers, lists).

Text to summarize:
${text}
`;
  },
  
  getProblemExplainerPrompt: (problem: string) => `
You are an expert tutor. Please explain the following concept, problem, or excerpt step-by-step.
Be patient, clear, and encouraging. Use formatting to make your explanation readable.

Problem/Concept:
${problem}
`
};
