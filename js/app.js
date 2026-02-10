// ========================================
// I18n 초기화
// ========================================

(async function initI18n() {
    await i18n.loadTranslations(i18n.getCurrentLanguage());
    i18n.updateUI();

    const langToggle = document.getElementById('lang-toggle');
    const langMenu = document.getElementById('lang-menu');
    const langOptions = document.querySelectorAll('.lang-option');

    // 현재 언어 활성화
    document.querySelector(`[data-lang="${i18n.getCurrentLanguage()}"]`)?.classList.add('active');

    // 언어 메뉴 토글
    langToggle?.addEventListener('click', () => langMenu.classList.toggle('hidden'));

    // 외부 클릭 시 메뉴 닫기
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.language-selector')) {
            langMenu?.classList.add('hidden');
        }
    });

    // 언어 선택
    langOptions.forEach(opt => {
        opt.addEventListener('click', async () => {
            await i18n.setLanguage(opt.getAttribute('data-lang'));
            langOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            langMenu.classList.add('hidden');

            // 앱 UI 업데이트 트리거
            if (app && app.renderHistory && app.renderFavorites) {
                app.renderHistory();
                app.renderFavorites();
            }
        });
    });
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

    const categoryKey = this.currentCard.category === 'quote'
      ? 'categories.quote'
      : `categories.${this.currentCard.category}`;
    const categoryName = i18n.t(categoryKey);
    const categoryInfo = this.currentCard.category === 'quote'
      ? { emoji: '💬', name: categoryName }
      : { emoji: categories[this.currentCard.category].emoji, name: categoryName };
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
      const categoryKey = item.category === 'quote'
        ? 'categories.quote'
        : `categories.${item.category}`;
      const categoryName = i18n.t(categoryKey);
      const categoryInfo = item.category === 'quote'
        ? { emoji: '💬', name: categoryName }
        : { emoji: categories[item.category].emoji, name: categoryName };

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
      const categoryKey = fav.category === 'quote'
        ? 'categories.quote'
        : `categories.${fav.category}`;
      const categoryName = i18n.t(categoryKey);
      const categoryInfo = fav.category === 'quote'
        ? { emoji: '💬', name: categoryName }
        : { emoji: categories[fav.category].emoji, name: categoryName };

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
    const categoryInfo = categories[card.category] || { emoji: '💬', name: '오늘의 명언' };

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
    const deepData = {
      'self-love': {
        interpretations: [
          '자기 사랑은 모든 성장의 근원입니다. 이 확언은 당신이 외부의 인정 없이도 스스로 충분하다는 것을 일깨워줍니다.',
          '자존감은 하루아침에 세워지지 않습니다. 매일 이 확언을 반복하며 내면의 목소리를 긍정적으로 바꿔보세요.',
          '자신에 대한 사랑은 이기적인 것이 아닙니다. 자기를 먼저 채워야 타인에게도 나눌 수 있습니다.'
        ],
        practices: [
          '거울 앞에서 3분간 자신에게 긍정적인 말을 해보세요',
          '오늘 자신에게 감사한 점 3가지를 적어보세요',
          '좋아하는 활동에 30분을 투자해 자신을 보살펴주세요',
          '부정적인 자기 대화가 떠오를 때, 이 확언으로 대체해보세요'
        ],
        meditations: [
          '눈을 감고 천천히 숨을 쉬며, "나는 충분하다"를 5번 반복하세요',
          '가슴에 손을 얹고, 심장 박동을 느끼며 자신의 존재에 감사하세요',
          '따뜻한 빛이 몸 전체를 감싸는 상상을 하며 안정감을 느껴보세요'
        ],
        journals: [
          '오늘 나 자신을 위해 한 가장 좋은 일은 무엇인가요?',
          '나를 가장 행복하게 만드는 나만의 특성은 무엇인가요?',
          '내가 스스로에게 더 친절할 수 있는 방법 한 가지는?'
        ]
      },
      'motivation': {
        interpretations: [
          '동기부여는 감정이 아닌 습관입니다. 이 확언은 매일의 작은 행동이 큰 변화를 만든다는 것을 상기시켜줍니다.',
          '성공은 한 번의 도약이 아닌 꾸준한 발걸음입니다. 오늘의 노력이 내일의 결실이 됩니다.',
          '두려움은 성장의 신호입니다. 도전을 피하지 말고 그 안에서 힘을 찾아보세요.'
        ],
        practices: [
          '오늘의 가장 중요한 목표 하나를 정하고 반드시 실행하세요',
          '5분 타이머를 맞추고 미루던 일을 시작해보세요',
          '성공한 순간들을 리스트로 적어 자신감을 보충하세요',
          '저녁에 오늘 달성한 것들을 되돌아보며 성취감을 느껴보세요'
        ],
        meditations: [
          '목표를 이룬 미래의 나를 생생하게 상상하며 그 감정을 느껴보세요',
          '어려운 순간을 극복한 과거의 경험을 떠올리며 힘을 얻으세요',
          '"나는 할 수 있다"를 깊은 호흡과 함께 반복하세요'
        ],
        journals: [
          '올해 반드시 이루고 싶은 목표와 그 이유는 무엇인가요?',
          '지난주 가장 자랑스러운 성취는 무엇이었나요?',
          '내일의 나에게 해주고 싶은 응원의 한마디는?'
        ]
      },
      'gratitude': {
        interpretations: [
          '감사는 마음의 근육입니다. 매일 훈련할수록 더 많은 행복을 발견하게 됩니다.',
          '감사하는 마음은 현재를 풍요롭게 만들고, 미래에 대한 긍정적 기대를 높여줍니다.',
          '작은 것에 감사할 줄 아는 사람은 큰 행복도 알아볼 수 있습니다.'
        ],
        practices: [
          '잠들기 전 감사한 3가지를 적어보세요',
          '오늘 만난 누군가에게 감사의 메시지를 보내보세요',
          '식사 전 잠시 멈추고 음식에 감사하는 시간을 가져보세요',
          '산책하며 주변의 아름다움을 하나씩 발견해보세요'
        ],
        meditations: [
          '호흡에 집중하며, 매 숨이 주어지는 것에 감사하세요',
          '사랑하는 사람들의 얼굴을 떠올리며 따뜻한 감정을 보내세요',
          '지금 이 순간 당연하게 여기는 것들에 의미를 부여해보세요'
        ],
        journals: [
          '최근 가장 감사했던 순간은 언제인가요?',
          '당연하게 여기던 것 중 새삼 감사한 것은?',
          '감사 일기를 시작한다면 첫 페이지에 뭘 쓰고 싶나요?'
        ]
      },
      'relationships': {
        interpretations: [
          '좋은 관계는 소통과 이해에서 시작됩니다. 이 확언은 타인과의 연결이 삶을 풍요롭게 한다는 것을 일깨워줍니다.',
          '건강한 경계를 세우는 것도 사랑의 일부입니다. 자신을 보호하면서 타인을 존중하는 균형을 찾아보세요.',
          '모든 관계는 나 자신과의 관계에서 시작됩니다. 내면이 건강해야 외부 관계도 건강해집니다.'
        ],
        practices: [
          '오늘 소중한 사람에게 진심 어린 한마디를 전해보세요',
          '대화할 때 상대방의 말에 온전히 집중해보세요',
          '갈등 상황에서 "나" 메시지로 감정을 표현해보세요',
          '오래 연락하지 못한 친구에게 안부를 전해보세요'
        ],
        meditations: [
          '사랑하는 사람들에게 빛과 평화를 보내는 상상을 해보세요',
          '힘든 관계가 있다면 그 사람에게도 상처가 있었음을 이해해보세요',
          '내 주변의 소중한 인연들에 감사하며 미소를 지어보세요'
        ],
        journals: [
          '내 인생에서 가장 소중한 관계는 누구이고, 왜인가요?',
          '최근 누군가에게 받은 따뜻한 행동은 무엇인가요?',
          '더 나은 관계를 위해 내가 할 수 있는 한 가지는?'
        ]
      },
      'success': {
        interpretations: [
          '성공은 목적지가 아닌 여정입니다. 과정에서의 배움과 성장 자체가 가장 큰 성공입니다.',
          '성공의 정의는 사람마다 다릅니다. 자신만의 성공 기준을 세우고 그것을 향해 나아가세요.',
          '실패는 성공의 반대가 아니라 성공으로 가는 길의 일부입니다.'
        ],
        practices: [
          '오늘의 우선순위 TOP 3를 정하고 집중해보세요',
          '성공한 롤모델의 습관 하나를 오늘부터 실천해보세요',
          '비전보드를 만들어 목표를 시각화해보세요',
          '매일 15분씩 자기 개발에 투자하는 시간을 만들어보세요'
        ],
        meditations: [
          '목표를 달성한 순간을 구체적으로 상상하며 그 기쁨을 미리 느껴보세요',
          '지금까지의 여정을 돌아보며 얼마나 멀리 왔는지 인식하세요',
          '"나는 성공할 자격이 있다"를 확신을 가지고 반복하세요'
        ],
        journals: [
          '나에게 성공이란 무엇을 의미하나요?',
          '5년 후 이상적인 나의 모습은 어떤가요?',
          '지금까지의 인생에서 가장 큰 성취는 무엇이었나요?'
        ]
      },
      'quote': {
        interpretations: [
          '위대한 인물의 말에는 시대를 초월한 지혜가 담겨 있습니다. 이 명언이 당신의 하루에 영감을 주길 바랍니다.',
          '명언은 거울과 같습니다. 읽는 사람의 상황에 따라 다른 의미로 다가옵니다.',
          '진정한 지혜는 아는 것에서 끝나지 않고 실천하는 것에서 빛납니다.'
        ],
        practices: [
          '이 명언을 메모장에 적어 하루 동안 수시로 읽어보세요',
          '이 말의 의미를 자신의 상황에 적용해보세요',
          '비슷한 명언을 찾아보며 같은 주제로 깊이 사색해보세요',
          '이 명언을 소중한 사람에게 공유해보세요'
        ],
        meditations: [
          '이 명언을 마음속으로 천천히 반복하며 그 의미를 음미해보세요',
          '명언의 저자가 이 말을 했을 때의 상황을 상상해보세요',
          '이 지혜가 당신의 삶에 어떻게 적용될 수 있는지 생각해보세요'
        ],
        journals: [
          '이 명언이 지금의 나에게 어떤 의미로 다가오나요?',
          '이 말을 실천하기 위해 오늘 할 수 있는 일은?',
          '나만의 인생 명언을 만든다면 어떤 말을 남기고 싶나요?'
        ]
      }
    };

    const catData = deepData[card.category] || deepData['self-love'];
    const randIdx = (arr) => Math.floor(Math.random() * arr.length);

    return {
      interpretation: catData.interpretations[randIdx(catData.interpretations)],
      practices: catData.practices,
      meditation: catData.meditations[randIdx(catData.meditations)],
      journal: catData.journals[randIdx(catData.journals)]
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
