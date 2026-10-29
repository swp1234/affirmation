
function preserveLanguageLinks() {
    var urlLang = new URLSearchParams(window.location.search).get('lang');
    var currentLang = urlLang || (typeof i18n !== 'undefined' && typeof i18n.getCurrentLanguage === 'function' ? i18n.getCurrentLanguage() : null) || 'ko';
    var links = document.querySelectorAll('a[href^="/"], .related-card');
    var base = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'https://dopabrain.com';
    links.forEach(function(link) {
        var href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('#')) return;
        try {
            var url = new URL(href, base);
            url.searchParams.set('lang', currentLang);
            link.setAttribute('href', url.pathname + url.search);
        } catch(e) {}
    });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preserveLanguageLinks);
} else {
    preserveLanguageLinks();
}

// ========================================
// I18n 초기화
// ========================================

(async function initI18n() {
    try {
        await i18n.loadTranslations(i18n.getCurrentLanguage());
        i18n.updateUI();

        const langToggle = document.getElementById('lang-toggle');
        const langMenu = document.getElementById('lang-menu');
        const langOptions = document.querySelectorAll('.lang-option');

        document.querySelector(`[data-lang="${i18n.getCurrentLanguage()}"]`)?.classList.add('active');
        langToggle?.addEventListener('click', () => langMenu.classList.toggle('hidden'));
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.language-selector')) {
                langMenu?.classList.add('hidden');
            }
        });

        langOptions.forEach(opt => {
            opt.addEventListener('click', async () => {
                await i18n.setLanguage(opt.getAttribute('data-lang'));
                langOptions.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                langMenu.classList.add('hidden');
                if (app && app.renderHistory && app.renderFavorites) {
                    app.renderHistory();
                    app.renderFavorites();
                }
            });
        });
    } catch (e) {
        console.warn('i18n init failed:', e);
    }
})();

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

  // Map category ID to i18n key name
  _categoryI18nMap = {
    'self-love': 'selfLove',
    'motivation': 'motivation',
    'gratitude': 'gratitude',
    'relationships': 'relationships',
    'success': 'success',
    'quote': 'quote'
  };

  // Get i18n key for a category
  getCategoryI18nKey(category) {
    return `categories.${this._categoryI18nMap[category] || category}`;
  }

  // Get category display info (emoji + translated name)
  getCategoryInfo(category) {
    const categoryName = i18n.t(this.getCategoryI18nKey(category));
    if (category === 'quote') {
      return { emoji: '💬', name: categoryName };
    }
    return { emoji: (categories[category] && categories[category].emoji) || '✨', name: categoryName };
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

    const categoryInfo = this.getCategoryInfo(this.currentCard.category);
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
      historyList.innerHTML = '';
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-message';
      emptyMsg.setAttribute('data-i18n', 'history.empty');
      emptyMsg.textContent = i18n.t('history.empty');
      historyList.appendChild(emptyMsg);
      return;
    }

    historyList.innerHTML = '';
    this.history.forEach((item, index) => {
      const categoryInfo = this.getCategoryInfo(item.category);

      const div = document.createElement('div');
      div.className = 'history-item slide-in';
      div.style.animationDelay = `${index * 0.05}s`;

      const textDiv = document.createElement('div');
      textDiv.className = 'history-text';

      const emoji = document.createElement('span');
      emoji.style.marginRight = '8px';
      emoji.textContent = categoryInfo.emoji;
      textDiv.appendChild(emoji);

      const text = document.createTextNode(
        item.text.substring(0, 50) + (item.text.length > 50 ? '...' : '')
      );
      textDiv.appendChild(text);
      div.appendChild(textDiv);
      historyList.appendChild(div);
    });
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
      favoritesList.innerHTML = '';
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-message';
      emptyMsg.setAttribute('data-i18n', 'favorites.empty');
      emptyMsg.textContent = i18n.t('favorites.empty');
      favoritesList.appendChild(emptyMsg);
      return;
    }

    favoritesList.innerHTML = '';
    this.favorites.forEach((fav, index) => {
      const categoryInfo = this.getCategoryInfo(fav.category);

      const div = document.createElement('div');
      div.className = 'favorite-item slide-in';
      div.style.animationDelay = `${index * 0.05}s`;

      const textDiv = document.createElement('div');
      textDiv.className = 'favorite-text';

      const emoji = document.createElement('span');
      emoji.style.marginRight = '8px';
      emoji.textContent = categoryInfo.emoji;
      textDiv.appendChild(emoji);

      const text = document.createTextNode(fav.text);
      textDiv.appendChild(text);
      div.appendChild(textDiv);

      const btn = document.createElement('button');
      btn.className = 'remove-favorite';
      btn.textContent = '✕';
      btn.dataset.id = fav.id;
      btn.addEventListener('click', () => this.removeFavorite(fav.id));
      div.appendChild(btn);

      favoritesList.appendChild(div);
    });
  }

  // 즐겨찾기 제거
  removeFavorite(id) {
    this.favorites = this.favorites.filter(f => String(f.id) !== String(id));
    this.saveToStorage('favorites', this.favorites);
    this.renderFavorites();
    this.renderCard();
    this.renderStats();
  }

  // 통계 렌더링
  renderStats() {
    document.getElementById('totalCards').textContent = this.stats.totalCards;
    document.getElementById('streakDays').textContent = this.stats.streakDays;
    document.getElementById('favoriteCount').textContent = this.favorites.length;
    this.renderStreakCalendar();
  }

  // 스트릭 캘린더 렌더링
  renderStreakCalendar() {
    const container = document.getElementById('streakCalendar');
    if (!container) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const todayStr = now.toDateString();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 방문한 날짜 세트 생성
    const visitedSet = new Set();
    if (this.stats.visitDates) {
      this.stats.visitDates.forEach(dateStr => {
        const d = new Date(dateStr);
        if (d.getFullYear() === year && d.getMonth() === month) {
          visitedSet.add(d.getDate());
        }
      });
    }

    // i18n으로 월과 요일 이름 가져오기
    const monthNames = [
      i18n.t('calendar.months.jan'),
      i18n.t('calendar.months.feb'),
      i18n.t('calendar.months.mar'),
      i18n.t('calendar.months.apr'),
      i18n.t('calendar.months.may'),
      i18n.t('calendar.months.jun'),
      i18n.t('calendar.months.jul'),
      i18n.t('calendar.months.aug'),
      i18n.t('calendar.months.sep'),
      i18n.t('calendar.months.oct'),
      i18n.t('calendar.months.nov'),
      i18n.t('calendar.months.dec')
    ];
    const dayNames = [
      i18n.t('calendar.days.sun'),
      i18n.t('calendar.days.mon'),
      i18n.t('calendar.days.tue'),
      i18n.t('calendar.days.wed'),
      i18n.t('calendar.days.thu'),
      i18n.t('calendar.days.fri'),
      i18n.t('calendar.days.sat')
    ];

    const visitedLabel = i18n.t('calendar.visited');
    let html = `<div class="streak-cal-header">${year}${i18n.t('calendar.year')} ${monthNames[month]} ${visitedLabel}</div>`;
    html += '<div class="streak-cal-days">';
    dayNames.forEach(d => { html += `<div class="streak-cal-day-name">${d}</div>`; });

    for (let i = 0; i < firstDay; i++) {
      html += '<div class="streak-cal-cell empty"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today ? ' today' : '';
      const isVisited = visitedSet.has(d) ? ' visited' : '';
      html += `<div class="streak-cal-cell${isToday}${isVisited}">${d}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
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
    const appTitle = i18n.t('header.title').replace('✨ ', '').trim();
    const text = `${this.currentCard.text}\n\n- ${appTitle}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: appTitle,
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
      alert(i18n.t('share.copiedSuccess'));
    }).catch(() => {
      alert(i18n.t('share.notAvailable'));
    });
  }

  // 테마 설정
  setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      const themeIcon = themeToggle.querySelector('.theme-icon');
      if (themeIcon) {
        themeIcon.textContent = savedTheme === 'light' ? '🌙' : '☀️';
      }
    }
  }

  // 테마 토글
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      const themeIcon = themeToggle.querySelector('.theme-icon');
      if (themeIcon) {
        themeIcon.textContent = next === 'light' ? '🌙' : '☀️';
      }
    }
  }

  // 전면 광고 표시
  showInterstitialAd() {
    return new Promise((resolve) => {
      const overlay = document.getElementById('interstitialAd');
      const closeBtn = document.getElementById('closeAdBtn');
      const countdown = document.getElementById('adCountdown');

      overlay.classList.remove('hidden');
      closeBtn.disabled = true;
      let seconds = 5;
      countdown.textContent = seconds;

      const timer = setInterval(() => {
        seconds--;
        countdown.textContent = seconds;
        if (seconds <= 0) {
          clearInterval(timer);
          closeBtn.disabled = false;
          closeBtn.textContent = i18n.t('modal.close');
        }
      }, 1000);

      closeBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
        closeBtn.disabled = true;
        countdown.textContent = '5';
        resolve();
      }, { once: true });
    });
  }

  // 프리미엄 콘텐츠 표시
  async showPremiumContent() {
    if (!this.currentCard) return;

    // 전면 광고 표시 후 프리미엄 콘텐츠
    await this.showInterstitialAd();

    const premiumModal = document.getElementById('premiumModal');
    const premiumBody = document.getElementById('premiumBody');

    const card = this.currentCard;
    const categoryInfo = this.getCategoryInfo(card.category);

    // AI 심층 확언 생성
    const deepAffirmation = this.generateDeepAffirmation(card);

    // DOM 요소 안전하게 생성
    premiumBody.innerHTML = '';

    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'premium-category';
    categoryDiv.appendChild(document.createTextNode(`${categoryInfo.emoji} ${categoryInfo.name}`));
    premiumBody.appendChild(categoryDiv);

    const originalDiv = document.createElement('div');
    originalDiv.className = 'premium-original';
    const h3a = document.createElement('h3');
    h3a.textContent = i18n.t('premium.todayAffirmation');
    const pa = document.createElement('p');
    pa.textContent = `"${card.text}"`;
    originalDiv.appendChild(h3a);
    originalDiv.appendChild(pa);
    premiumBody.appendChild(originalDiv);

    const deepDiv = document.createElement('div');
    deepDiv.className = 'premium-deep';
    const h3b = document.createElement('h3');
    h3b.textContent = i18n.t('premium.deepInterpretation');
    const pb = document.createElement('p');
    pb.textContent = deepAffirmation.interpretation;
    deepDiv.appendChild(h3b);
    deepDiv.appendChild(pb);
    premiumBody.appendChild(deepDiv);

    const practiceDiv = document.createElement('div');
    practiceDiv.className = 'premium-practice';
    const h3c = document.createElement('h3');
    h3c.textContent = i18n.t('premium.practiceGuide');
    const ul = document.createElement('ul');
    deepAffirmation.practices.forEach(p => {
      const li = document.createElement('li');
      li.textContent = p;
      ul.appendChild(li);
    });
    practiceDiv.appendChild(h3c);
    practiceDiv.appendChild(ul);
    premiumBody.appendChild(practiceDiv);

    const meditationDiv = document.createElement('div');
    meditationDiv.className = 'premium-meditation';
    const h3d = document.createElement('h3');
    h3d.textContent = i18n.t('premium.meditation');
    const pm = document.createElement('p');
    pm.className = 'meditation-text';
    pm.textContent = `"${deepAffirmation.meditation}"`;
    meditationDiv.appendChild(h3d);
    meditationDiv.appendChild(pm);
    premiumBody.appendChild(meditationDiv);

    const journalDiv = document.createElement('div');
    journalDiv.className = 'premium-journal';
    const h3e = document.createElement('h3');
    h3e.textContent = i18n.t('premium.journalQuestion');
    const pj = document.createElement('p');
    pj.textContent = deepAffirmation.journal;
    journalDiv.appendChild(h3e);
    journalDiv.appendChild(pj);
    premiumBody.appendChild(journalDiv);

    premiumModal.classList.remove('hidden');
  }

  // 심층 확언 생성
  generateDeepAffirmation(card) {
    const categoryMap = {
      'self-love': 'selfLove',
      'motivation': 'motivation',
      'gratitude': 'gratitude',
      'relationships': 'relationships',
      'success': 'success',
      'quote': 'quote'
    };

    const catKey = categoryMap[card.category] || 'selfLove';
    const randIdx = (arr) => Math.floor(Math.random() * arr.length);

    // i18n에서 데이터 가져오기
    const deepData = window.i18n?.t(`deepAffirmation.${catKey}`);

    if (!deepData) {
      // 폴백: 영어 기본값 반환
      return {
        interpretation: 'Deep affirmation unavailable',
        practices: [],
        meditation: 'Meditation text',
        journal: 'Journal prompt'
      };
    }

    const psychologyArray = deepData.psychology || [];
    const actionsArray = deepData.actions || [];
    const meditationArray = deepData.meditation || [];
    const journalArray = deepData.journal || [];

    return {
      interpretation: psychologyArray[randIdx(psychologyArray)] || 'Deep interpretation',
      practices: actionsArray,
      meditation: meditationArray[randIdx(meditationArray)] || 'Meditation guidance',
      journal: journalArray[randIdx(journalArray)] || 'Journal question'
    };
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

    // 프리미엄 콘텐츠 버튼
    document.getElementById('premiumBtn').addEventListener('click', () => {
      this.showPremiumContent();
    });

    // 프리미엄 모달 닫기
    document.getElementById('closePremiumBtn').addEventListener('click', () => {
      document.getElementById('premiumModal').classList.add('hidden');
    });
  }
}

// 앱 초기화
const app = new AffirmationApp();

// Hide app loader
const loader = document.getElementById('app-loader');
if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 300);
}

// Service Worker 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.log('SW registration failed:', err));
  });
}

// PWA 설치 프롬프트
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});
