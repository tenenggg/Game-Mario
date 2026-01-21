// Financial Management MCQ Questions (concept-only, no calculations)
export const financeQuestions = [
  {
    id: 1,
    question: 'What is the main goal of a firm in financial management?',
    options: [
      'Maximizing profit only',
      'Maximizing sales',
      'Maximizing shareholders\' wealth',
      'Minimizing expenses'
    ],
    correctAnswer: 2,
    explanation: "Goals of the Firm: financial management targets shareholders' wealth, not just sales or short-term profit."
  },
  {
    id: 2,
    question: 'Which of the following is a responsibility of a financial manager?',
    options: [
      'Designing advertisements',
      'Deciding how to invest company funds',
      'Hiring factory workers',
      'Managing social media'
    ],
    correctAnswer: 1,
    explanation: 'Responsibilities of Financial Managers: they allocate company funds to the best investment opportunities.'
  },
  {
    id: 3,
    question: 'Which category of finance focuses on managing money within a firm?',
    options: [
      'Personal finance',
      'Public finance',
      'Managerial (financial) finance',
      'Government finance'
    ],
    correctAnswer: 2,
    explanation: 'Categories of Finance: managerial finance covers how firms raise and use money.'
  },
  {
    id: 4,
    question: 'Which decision involves buying machines or setting up a new plant?',
    options: [
      'Financing decision',
      'Asset management decision',
      'Capital investment decision',
      'Dividend decision'
    ],
    correctAnswer: 2,
    explanation: 'Investment Decision: capital investment choices cover long-term assets like equipment and plants.'
  },
  {
    id: 5,
    question: 'Time value of money means that money today is worth...',
    options: [
      'The same as money tomorrow',
      'Less than money tomorrow',
      'More than the same amount in the future',
      'Only valuable when invested'
    ],
    correctAnswer: 2,
    explanation: 'Definition of TVM: money now can earn returns, so it is more valuable than the same amount later.'
  },
  {
    id: 6,
    question: 'Future value refers to:',
    options: [
      'Value of money before investment',
      'Accumulated amount including interest',
      'Money without interest',
      'Initial amount invested'
    ],
    correctAnswer: 1,
    explanation: 'Future Value: the amount a sum grows to after earning interest over time.'
  },
  {
    id: 7,
    question: 'Which statement best describes present value?',
    options: [
      'Value of money in the future',
      'Total interest earned',
      'Current value of a future amount',
      'Loan repayment amount'
    ],
    correctAnswer: 2,
    explanation: 'Present Value: discounts a future sum back to what it is worth today.'
  },
  {
    id: 8,
    question: 'Which concept explains why receiving money earlier is better?',
    options: [
      'Risk',
      'Profit maximization',
      'Time value of money',
      'Inflation'
    ],
    correctAnswer: 2,
    explanation: 'Importance of TVM: earlier cash can be invested sooner, increasing value.'
  },
  {
    id: 9,
    question: 'Which financial statement shows a company\'s assets and liabilities?',
    options: [
      'Income statement',
      'Cash flow statement',
      'Balance sheet',
      'Statement of profit'
    ],
    correctAnswer: 2,
    explanation: 'Balance Sheet: reports assets, liabilities, and equity at a point in time.'
  },
  {
    id: 10,
    question: 'The income statement mainly shows:',
    options: [
      'Assets and equity',
      'Cash inflows only',
      'Profit and loss over a period',
      'Company ownership'
    ],
    correctAnswer: 2,
    explanation: 'Income Statement: measures revenues minus expenses to show profit or loss for the period.'
  },
  {
    id: 11,
    question: 'Which item is classified as an asset?',
    options: [
      'Loan payable',
      'Accounts payable',
      'Cash',
      'Bank overdraft'
    ],
    correctAnswer: 2,
    explanation: 'Assets vs Liabilities: cash is a resource owned by the company.'
  },
  {
    id: 12,
    question: 'Which section of the cash flow statement relates to daily business activities?',
    options: [
      'Investing activities',
      'Financing activities',
      'Operating activities',
      'Capital activities'
    ],
    correctAnswer: 2,
    explanation: 'Statement of Cash Flows: operating activities reflect core, day-to-day operations.'
  }
];

export const getRandomQuestion = (usedQuestionIds = []) => {
  const availableQuestions = financeQuestions.filter(q => !usedQuestionIds.includes(q.id));
  if (availableQuestions.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
};
