// 긍정 확언 데이터
const affirmations = [
  // 자존감 (Self-Love) - 20개
  {
    id: 1,
    category: 'self-love',
    text: '나는 있는 그대로의 나를 사랑합니다',
    author: ''
  },
  {
    id: 2,
    category: 'self-love',
    text: '나는 충분히 가치 있는 사람입니다',
    author: ''
  },
  {
    id: 3,
    category: 'self-love',
    text: '나의 감정은 소중하고 타당합니다',
    author: ''
  },
  {
    id: 4,
    category: 'self-love',
    text: '나는 나 자신에게 친절합니다',
    author: ''
  },
  {
    id: 5,
    category: 'self-love',
    text: '완벽하지 않아도 괜찮습니다',
    author: ''
  },
  {
    id: 6,
    category: 'self-love',
    text: '나는 나만의 속도로 성장하고 있습니다',
    author: ''
  },
  {
    id: 7,
    category: 'self-love',
    text: '나는 사랑받을 자격이 있습니다',
    author: ''
  },
  {
    id: 8,
    category: 'self-love',
    text: '나의 존재만으로도 충분합니다',
    author: ''
  },
  {
    id: 9,
    category: 'self-love',
    text: '나는 스스로를 자랑스럽게 여깁니다',
    author: ''
  },
  {
    id: 10,
    category: 'self-love',
    text: '나는 나 자신의 최고의 친구입니다',
    author: ''
  },
  {
    id: 11,
    category: 'self-love',
    text: '나는 내 자신을 온전히 받아들입니다',
    author: ''
  },
  {
    id: 12,
    category: 'self-love',
    text: '나는 매일 더 나은 사람이 되고 있습니다',
    author: ''
  },
  {
    id: 13,
    category: 'self-love',
    text: '나의 몸과 마음을 존중합니다',
    author: ''
  },
  {
    id: 14,
    category: 'self-love',
    text: '나는 나 자신을 먼저 챙깁니다',
    author: ''
  },
  {
    id: 15,
    category: 'self-love',
    text: '나는 나의 선택을 믿습니다',
    author: ''
  },
  {
    id: 16,
    category: 'self-love',
    text: '나는 나를 위해 시간을 씁니다',
    author: ''
  },
  {
    id: 17,
    category: 'self-love',
    text: '나는 나의 한계를 존중합니다',
    author: ''
  },
  {
    id: 18,
    category: 'self-love',
    text: '나는 나 자신에게 인내심을 갖습니다',
    author: ''
  },
  {
    id: 19,
    category: 'self-love',
    text: '나는 나의 과거를 용서합니다',
    author: ''
  },
  {
    id: 20,
    category: 'self-love',
    text: '나는 나 자신을 위해 최선을 다합니다',
    author: ''
  },

  // 동기부여 (Motivation) - 20개
  {
    id: 21,
    category: 'motivation',
    text: '나는 내가 원하는 것을 이룰 수 있습니다',
    author: ''
  },
  {
    id: 22,
    category: 'motivation',
    text: '오늘도 나는 한 걸음 앞으로 나아갑니다',
    author: ''
  },
  {
    id: 23,
    category: 'motivation',
    text: '어려움은 나를 더 강하게 만듭니다',
    author: ''
  },
  {
    id: 24,
    category: 'motivation',
    text: '나는 끊임없이 배우고 성장합니다',
    author: ''
  },
  {
    id: 25,
    category: 'motivation',
    text: '나는 내 꿈을 실현할 힘이 있습니다',
    author: ''
  },
  {
    id: 26,
    category: 'motivation',
    text: '포기하지 않으면 반드시 이룰 수 있습니다',
    author: ''
  },
  {
    id: 27,
    category: 'motivation',
    text: '나는 오늘 최선을 다합니다',
    author: ''
  },
  {
    id: 28,
    category: 'motivation',
    text: '나는 실패에서 배웁니다',
    author: ''
  },
  {
    id: 29,
    category: 'motivation',
    text: '나는 무한한 가능성을 가지고 있습니다',
    author: ''
  },
  {
    id: 30,
    category: 'motivation',
    text: '나는 목표를 향해 꾸준히 나아갑니다',
    author: ''
  },
  {
    id: 31,
    category: 'motivation',
    text: '나는 변화를 두려워하지 않습니다',
    author: ''
  },
  {
    id: 32,
    category: 'motivation',
    text: '나는 도전을 즐깁니다',
    author: ''
  },
  {
    id: 33,
    category: 'motivation',
    text: '나는 집중력이 뛰어납니다',
    author: ''
  },
  {
    id: 34,
    category: 'motivation',
    text: '나는 생산적인 하루를 보냅니다',
    author: ''
  },
  {
    id: 35,
    category: 'motivation',
    text: '나는 장애물을 기회로 만듭니다',
    author: ''
  },
  {
    id: 36,
    category: 'motivation',
    text: '나는 열정으로 가득 차 있습니다',
    author: ''
  },
  {
    id: 37,
    category: 'motivation',
    text: '나는 끝까지 해냅니다',
    author: ''
  },
  {
    id: 38,
    category: 'motivation',
    text: '나는 긍정적인 에너지로 가득합니다',
    author: ''
  },
  {
    id: 39,
    category: 'motivation',
    text: '나는 새로운 시작을 환영합니다',
    author: ''
  },
  {
    id: 40,
    category: 'motivation',
    text: '나는 내 인생의 주인공입니다',
    author: ''
  },

  // 감사 (Gratitude) - 20개
  {
    id: 41,
    category: 'gratitude',
    text: '나는 오늘 하루에 감사합니다',
    author: ''
  },
  {
    id: 42,
    category: 'gratitude',
    text: '나는 내 주변의 사랑에 감사합니다',
    author: ''
  },
  {
    id: 43,
    category: 'gratitude',
    text: '나는 건강한 몸에 감사합니다',
    author: ''
  },
  {
    id: 44,
    category: 'gratitude',
    text: '나는 작은 것에도 감사할 줄 압니다',
    author: ''
  },
  {
    id: 45,
    category: 'gratitude',
    text: '나는 지금 이 순간에 감사합니다',
    author: ''
  },
  {
    id: 46,
    category: 'gratitude',
    text: '나는 내가 가진 것에 만족합니다',
    author: ''
  },
  {
    id: 47,
    category: 'gratitude',
    text: '나는 행복한 순간들을 기억합니다',
    author: ''
  },
  {
    id: 48,
    category: 'gratitude',
    text: '나는 배움의 기회에 감사합니다',
    author: ''
  },
  {
    id: 49,
    category: 'gratitude',
    text: '나는 삶의 모든 경험에 감사합니다',
    author: ''
  },
  {
    id: 50,
    category: 'gratitude',
    text: '나는 나를 지지하는 사람들에게 감사합니다',
    author: ''
  },
  {
    id: 51,
    category: 'gratitude',
    text: '나는 안전한 공간이 있음에 감사합니다',
    author: ''
  },
  {
    id: 52,
    category: 'gratitude',
    text: '나는 새로운 하루가 주어짐에 감사합니다',
    author: ''
  },
  {
    id: 53,
    category: 'gratitude',
    text: '나는 자연의 아름다움에 감사합니다',
    author: ''
  },
  {
    id: 54,
    category: 'gratitude',
    text: '나는 음식이 있음에 감사합니다',
    author: ''
  },
  {
    id: 55,
    category: 'gratitude',
    text: '나는 웃을 수 있음에 감사합니다',
    author: ''
  },
  {
    id: 56,
    category: 'gratitude',
    text: '나는 호흡할 수 있음에 감사합니다',
    author: ''
  },
  {
    id: 57,
    category: 'gratitude',
    text: '나는 평화로운 순간에 감사합니다',
    author: ''
  },
  {
    id: 58,
    category: 'gratitude',
    text: '나는 내 능력에 감사합니다',
    author: ''
  },
  {
    id: 59,
    category: 'gratitude',
    text: '나는 풍요로운 삶에 감사합니다',
    author: ''
  },
  {
    id: 60,
    category: 'gratitude',
    text: '나는 지금 이 자리에 있음에 감사합니다',
    author: ''
  },

  // 관계 (Relationships) - 20개
  {
    id: 61,
    category: 'relationships',
    text: '나는 건강한 관계를 만들어갑니다',
    author: ''
  },
  {
    id: 62,
    category: 'relationships',
    text: '나는 사람들에게 긍정적인 영향을 줍니다',
    author: ''
  },
  {
    id: 63,
    category: 'relationships',
    text: '나는 진심으로 소통합니다',
    author: ''
  },
  {
    id: 64,
    category: 'relationships',
    text: '나는 타인을 존중합니다',
    author: ''
  },
  {
    id: 65,
    category: 'relationships',
    text: '나는 경청하는 법을 압니다',
    author: ''
  },
  {
    id: 66,
    category: 'relationships',
    text: '나는 건강한 경계를 설정합니다',
    author: ''
  },
  {
    id: 67,
    category: 'relationships',
    text: '나는 용서할 줄 압니다',
    author: ''
  },
  {
    id: 68,
    category: 'relationships',
    text: '나는 진정한 친구입니다',
    author: ''
  },
  {
    id: 69,
    category: 'relationships',
    text: '나는 사랑을 주고받습니다',
    author: ''
  },
  {
    id: 70,
    category: 'relationships',
    text: '나는 타인의 행복을 응원합니다',
    author: ''
  },
  {
    id: 71,
    category: 'relationships',
    text: '나는 공감 능력이 뛰어납니다',
    author: ''
  },
  {
    id: 72,
    category: 'relationships',
    text: '나는 신뢰할 수 있는 사람입니다',
    author: ''
  },
  {
    id: 73,
    category: 'relationships',
    text: '나는 갈등을 건설적으로 해결합니다',
    author: ''
  },
  {
    id: 74,
    category: 'relationships',
    text: '나는 감사를 표현합니다',
    author: ''
  },
  {
    id: 75,
    category: 'relationships',
    text: '나는 다양성을 존중합니다',
    author: ''
  },
  {
    id: 76,
    category: 'relationships',
    text: '나는 도움을 요청할 수 있습니다',
    author: ''
  },
  {
    id: 77,
    category: 'relationships',
    text: '나는 다른 사람을 판단하지 않습니다',
    author: ''
  },
  {
    id: 78,
    category: 'relationships',
    text: '나는 따뜻한 말을 건넵니다',
    author: ''
  },
  {
    id: 79,
    category: 'relationships',
    text: '나는 좋은 에너지를 전파합니다',
    author: ''
  },
  {
    id: 80,
    category: 'relationships',
    text: '나는 의미 있는 연결을 만듭니다',
    author: ''
  },

  // 성공 (Success) - 20개
  {
    id: 81,
    category: 'success',
    text: '나는 성공할 자격이 있습니다',
    author: ''
  },
  {
    id: 82,
    category: 'success',
    text: '나는 풍요로움을 받아들입니다',
    author: ''
  },
  {
    id: 83,
    category: 'success',
    text: '나는 기회를 만들어냅니다',
    author: ''
  },
  {
    id: 84,
    category: 'success',
    text: '나는 목표를 달성합니다',
    author: ''
  },
  {
    id: 85,
    category: 'success',
    text: '나는 현명한 결정을 내립니다',
    author: ''
  },
  {
    id: 86,
    category: 'success',
    text: '나는 성장 마인드셋을 가지고 있습니다',
    author: ''
  },
  {
    id: 87,
    category: 'success',
    text: '나는 창의적인 해결책을 찾습니다',
    author: ''
  },
  {
    id: 88,
    category: 'success',
    text: '나는 내 일을 사랑합니다',
    author: ''
  },
  {
    id: 89,
    category: 'success',
    text: '나는 리더십을 발휘합니다',
    author: ''
  },
  {
    id: 90,
    category: 'success',
    text: '나는 전문성을 키워갑니다',
    author: ''
  },
  {
    id: 91,
    category: 'success',
    text: '나는 기회를 포착합니다',
    author: ''
  },
  {
    id: 92,
    category: 'success',
    text: '나는 효율적으로 일합니다',
    author: ''
  },
  {
    id: 93,
    category: 'success',
    text: '나는 비전이 명확합니다',
    author: ''
  },
  {
    id: 94,
    category: 'success',
    text: '나는 계획을 실행합니다',
    author: ''
  },
  {
    id: 95,
    category: 'success',
    text: '나는 위험을 감수할 용기가 있습니다',
    author: ''
  },
  {
    id: 96,
    category: 'success',
    text: '나는 네트워크를 확장합니다',
    author: ''
  },
  {
    id: 97,
    category: 'success',
    text: '나는 우선순위를 정확히 파악합니다',
    author: ''
  },
  {
    id: 98,
    category: 'success',
    text: '나는 혁신적입니다',
    author: ''
  },
  {
    id: 99,
    category: 'success',
    text: '나는 성취감을 느낍니다',
    author: ''
  },
  {
    id: 100,
    category: 'success',
    text: '나는 나만의 길을 만들어갑니다',
    author: ''
  }
];

// 카테고리 정보
const categories = {
  'self-love': {
    name: '자존감',
    emoji: '💖',
    color: '#e91e63'
  },
  'motivation': {
    name: '동기부여',
    emoji: '🔥',
    color: '#ff6b6b'
  },
  'gratitude': {
    name: '감사',
    emoji: '🙏',
    color: '#feca57'
  },
  'relationships': {
    name: '관계',
    emoji: '🤝',
    color: '#48dbfb'
  },
  'success': {
    name: '성공',
    emoji: '⭐',
    color: '#1dd1a1'
  },
  'quote': {
    name: '오늘의 명언',
    emoji: '💬',
    color: '#9b59b6'
  }
};
