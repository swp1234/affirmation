// ========================================
// 긍정 확언 앱 - 메인 로직
// ========================================

class AffirmationApp {
  constructor() {
    this.currentCard = null;
    this.selectedCategory = 'all';
    this.favorites = this.loadFromStorage('favorites', []);
    this.history = this.loadFromStorage('history', []);
    this.stats = this.loadFromStorage('stats', {
      totalCards: 0,
      lastVisit: null,
      streakDays: 0,
      visitDates: [],
      categoryCount: {}
    });
    this.quotableCache = null;
    this.quotableCacheTime = 0;

    this.init();
  }

  init() {
    this.updateStreak();
    this.loadRandomCard();
    this.renderFavorites();
    this.renderHistory();
    this.renderStats();
    this.setupEventListeners();
    this.setupTheme();
  }

  // LocalStorage 관리
  loadFromStorage(key, defaultValue) {
    try {
      const data = localStorage.getItem(`affirmation_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('Storage load error:', e);
      return defaultValue;
    }
  }

  saveToStorage(key, value) {
    try {
      localStorage.setItem(`affirmation_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }

  // 연속 일수 업데이트
  updateStreak() {
    const today = new Date().toDateString();
    const lastVisit = this.stats.lastVisit;

    if (lastVisit !== today) {
      // 새로운 날 방문
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (lastVisit === yesterdayStr) {
        // 연속 방문
        this.stats.streakDays++;
      } else if (lastVisit !== null) {
        // 연속 끊김
        this.stats.streakDays = 1;
      } else {
        // 첫 방문
        this.stats.streakDays = 1;
      }

      this.stats.lastVisit = today;
      this.stats.visitDates.push(today);
      this.saveToStorage('stats', this.stats);
    }
  }

  // 랜덤 카드 로드
  async loadRandomCard() {
    // 오늘의 명언 카테고리
    if (this.selectedCategory === 'quote') {
      await this.loadQuotableCard();
      return;
    }

    let pool = affirmations;

    // 카테고리 필터
    if (this.selectedCategory !== 'all') {
      pool = affirmations.filter(a => a.category === this.selectedCategory);
    }

    // 랜덤 선택
    const randomIndex = Math.floor(Math.random() * pool.length);
    this.currentCard = pool[randomIndex];

    this.renderCard();
    this.addToHistory();
    this.incrementTotalCards();
  }

  // Quotable API에서 명언 가져오기
  async loadQuotableCard() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // 캐시 확인 (1시간 유효)
    if (this.quotableCache && (now - this.quotableCacheTime) < oneHour) {
      this.currentCard = this.quotableCache;
      this.renderCard();
      this.addToHistory();
      this.incrementTotalCards();
      return;
    }

    try {
      const response = await fetch('https://api.quotable.io/quotes/random?tags=inspirational|motivational');
      const data = await response.json();

      if (data && data.length > 0) {
        const quote = data[0];
        this.currentCard = {
          id: 'quote_' + Date.now(),
          category: 'quote',
          text: quote.content,
          author: quote.author
        };

        // 캐시 저장
        this.quotableCache = this.currentCard;
        this.quotableCacheTime = now;
      }
    } catch (error) {
      console.error('Quotable API error:', error);
      // 폴백: 기본 확언 사용
      this.selectedCategory = 'all';
      const randomIndex = Math.floor(Math.random() * affirmations.length);
      this.currentCard = affirmations[randomIndex];
    }

    this.renderCard();
    this.addToHistory();
    this.incrementTotalCards();
  }

  // 카드 렌더링
  renderCard() {
    const cardText = document.getElementById('cardText');
    const cardCategory = document.getElementById('cardCategory');
    const favoriteBtn = document.getElementById('favoriteBtn');
    const affirmationCard = document.getElementById('affirmationCard');

    // 애니메이션 리셋
    affirmationCard.style.animation = 'none';
    setTimeout(() => {
      affirmationCard.style.animation = '';
    }, 10);

    // 텍스트 업데이트
    let displayText = this.currentCard.text;
    if (this.currentCard.author) {
      displayText += `\n\n— ${this.currentCard.author}`;
    }
    cardText.textContent = displayText;
    cardText.style.whiteSpace = 'pre-line';

    const categoryInfo = this.currentCard.category === 'quote'
      ? { emoji: '💬', name: '오늘의 명언' }
      : categories[this.currentCard.category];
    cardCategory.textContent = `${categoryInfo.emoji} ${categoryInfo.name}`;

    // 즐겨찾기 상태
    const isFavorite = this.favorites.some(f => f.id === this.currentCard.id);
    favoriteBtn.classList.toggle('active', isFavorite);
    favoriteBtn.querySelector('.heart-icon').textContent = isFavorite ? '❤️' : '🤍';
  }

  // 히스토리에 추가
  addToHistory() {
    const historyItem = {
      ...this.currentCard,
      viewedAt: Date.now()
    };

    // 중복 제거
    this.history = this.history.filter(h => h.id !== this.currentCard.id);

    // 최신 항목을 맨 앞에 추가
    this.history.unshift(historyItem);

    // 최근 10개만 유지
    if (this.history.length > 10) {
      this.history = this.history.slice(0, 10);
    }

    this.saveToStorage('history', this.history);
    this.renderHistory();
  }

  // 히스토리 렌더링
  renderHistory() {
    const historyList = document.getElementById('historyList');

    if (this.history.length === 0) {
      historyList.innerHTML = '<p class="empty-message">아직 기록이 없습니다</p>';
      return;
    }

    historyList.innerHTML = this.history.map((item, index) => {
      const categoryInfo = item.category === 'quote'
        ? { emoji: '💬', name: '명언' }
        : categories[item.category];

      return `
        <div class="history-item slide-in" style="animation-delay: ${index * 0.05}s">
          <div class="history-text">
            <span style="margin-right: 8px">${categoryInfo.emoji}</span>
            ${item.text.substring(0, 50)}${item.text.length > 50 ? '...' : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // 총 카드 수 증가
  incrementTotalCards() {
    this.stats.totalCards++;
    this.saveToStorage('stats', this.stats);
    this.renderStats();
  }

  // 즐겨찾기 토글
  toggleFavorite() {
    const index = this.favorites.findIndex(f => f.id === this.currentCard.id);

    if (index > -1) {
      // 제거
      this.favorites.splice(index, 1);
    } else {
      // 추가
      this.favorites.push({
        id: this.currentCard.id,
        text: this.currentCard.text,
        category: this.currentCard.category
      });
    }

    this.saveToStorage('favorites', this.favorites);
    this.renderCard();
    this.renderFavorites();
    this.renderStats();
  }

  // 즐겨찾기 렌더링
  renderFavorites() {
    const favoritesList = document.getElementById('favoritesList');

    if (this.favorites.length === 0) {
      favoritesList.innerHTML = '<p class="empty-message">아직 즐겨찾기한 카드가 없습니다</p>';
      return;
    }

    favoritesList.innerHTML = this.favorites.map((fav, index) => {
      const categoryInfo = categories[fav.category];
      return `
        <div class="favorite-item slide-in" style="animation-delay: ${index * 0.05}s">
          <div class="favorite-text">
            <span style="margin-right: 8px">${categoryInfo.emoji}</span>
            ${fav.text}
          </div>
          <button class="remove-favorite" onclick="app.removeFavorite(${fav.id})">
            ✕
          </button>
        </div>
      `;
    }).join('');
  }

  // 즐겨찾기 제거
  removeFavorite(id) {
    this.favorites = this.favorites.filter(f => f.id !== id);
    this.saveToStorage('favorites', this.favorites);
    this.renderFavorites();
    this.renderStats();
  }

  // 통계 렌더링
  renderStats() {
    document.getElementById('totalCards').textContent = this.stats.totalCards;
    document.getElementById('streakDays').textContent = this.stats.streakDays;
    document.getElementById('favoriteCount').textContent = this.favorites.length;
  }

  // 카테고리 변경
  changeCategory(category) {
    this.selectedCategory = category;

    // 버튼 활성화 상태 변경
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });

    this.loadRandomCard();
  }

  // 공유하기
  async shareCard() {
    const text = `${this.currentCard.text}\n\n- 일일 긍정 확언 카드`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '긍정 확언',
          text: text
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          this.fallbackShare(text);
        }
      }
    } else {
      this.fallbackShare(text);
    }
  }

  // 공유 폴백 (클립보드 복사)
  fallbackShare(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert('클립보드에 복사되었습니다!');
    }).catch(() => {
      alert('공유 기능을 사용할 수 없습니다.');
    });
  }

  // 테마 설정
  setupTheme() {
    const savedTheme = localStorage.getItem('affirmation_theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      document.getElementById('themeToggle').querySelector('.theme-icon').textContent = '☀️';
    }
  }

  // 테마 토글
  toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeToggle').querySelector('.theme-icon');

    body.classList.toggle('light-theme');
    const isLight = body.classList.contains('light-theme');

    themeIcon.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('affirmation_theme', isLight ? 'light' : 'dark');
  }

  // 이벤트 리스너 설정
  setupEventListeners() {
    // 새 카드 버튼
    document.getElementById('newCardBtn').addEventListener('click', () => {
      this.loadRandomCard();
    });

    // 공유 버튼
    document.getElementById('shareBtn').addEventListener('click', () => {
      this.shareCard();
    });

    // 즐겨찾기 버튼
    document.getElementById('favoriteBtn').addEventListener('click', () => {
      this.toggleFavorite();
    });

    // 카테고리 버튼들
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.changeCategory(btn.dataset.category);
      });
    });

    // 테마 토글
    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggleTheme();
    });
  }
}

// 앱 초기화
const app = new AffirmationApp();

// PWA 설치 프롬프트
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});
