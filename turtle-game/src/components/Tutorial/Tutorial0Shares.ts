// Tutorial 0: Understanding Shares (Foundation)
// Step-by-step gamified introduction to how shares work

interface SharesState {
  step: number;
  sharesOwned: number;
  priceChange: number;
  sharePrice: number;
  userAnswer: string;
  score: number;
  totalQuestions: number;
}

interface Question {
  shares?: number;
  priceChange?: number;
  sharePrice?: number;
  text: string;
  type: 'gain' | 'cost' | 'portfolio';
}

export class Tutorial0Shares {
  private state: SharesState = {
    step: 1,
    sharesOwned: 100,
    priceChange: 1,
    sharePrice: 500,
    userAnswer: '',
    score: 0,
    totalQuestions: 8, // Increased for new questions
  };

  private container: HTMLElement;

  // Quiz questions
  private questions: Question[] = [
    // Basic gain questions
    { type: 'gain', shares: 100, priceChange: 1, text: "You own 100 shares. Price goes up $1. What's your gain?" },
    { type: 'gain', shares: 50, priceChange: 2, text: "You own 50 shares. Price goes up $2. What's your gain?" },

    // Capital cost questions
    { type: 'cost', shares: 100, sharePrice: 500, text: "Stock price is $500/share. How much capital do you need to buy 100 shares?" },
    { type: 'cost', shares: 85, sharePrice: 590, text: "SPY is trading at $590/share. How much capital to buy 85 shares?" },

    // Portfolio value change questions
    { type: 'portfolio', shares: 100, sharePrice: 500, priceChange: 5, text: "You bought 100 shares at $500. Price rises to $505. What's your NEW portfolio value?" },
    { type: 'portfolio', shares: 85, sharePrice: 590, priceChange: 5, text: "You bought 85 shares at $590. Price rises to $595. What's your NEW portfolio value?" },

    // Mixed difficulty
    { type: 'gain', shares: 85, priceChange: 5, text: "You own 85 shares. Price goes up $5. What's your gain?" },
    { type: 'gain', shares: 120, priceChange: -3, text: "You own 120 shares. Price goes DOWN $3. What's your loss?" },
  ];

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.attachEventListeners();
  }

  private calculateValue(): number {
    return this.state.sharesOwned * this.state.priceChange;
  }

  private getCurrentQuestion(): Question | null {
    const questionIndex = this.state.step - 4; // Questions start at step 4 now
    return this.questions[questionIndex] || null;
  }

  private checkAnswer(): boolean {
    const question = this.getCurrentQuestion();
    if (!question) return false;

    let correctAnswer = 0;

    if (question.type === 'gain') {
      correctAnswer = question.shares! * question.priceChange!;
    } else if (question.type === 'cost') {
      correctAnswer = question.shares! * question.sharePrice!;
    } else if (question.type === 'portfolio') {
      const newPrice = question.sharePrice! + question.priceChange!;
      correctAnswer = question.shares! * newPrice;
    }

    const userAnswer = parseInt(this.state.userAnswer);
    return userAnswer === correctAnswer;
  }

  private nextStep(): void {
    this.state.step++;
    this.state.userAnswer = '';
    this.render();
    this.attachEventListeners();
  }

  private submitAnswer(): void {
    if (this.checkAnswer()) {
      this.state.score++;
    }
    this.nextStep();
  }

  private renderStep1(): string {
    // Introduction: Simple example
    return `
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold mb-4">📚 Tutorial 0: Understanding Shares</h1>
        <div class="bg-blue-900/30 border border-blue-500 p-6 rounded mb-6">
          <p class="text-xl mb-4">
            Before we learn about options, let's understand the basics: <strong>shares</strong>.
          </p>
          <p class="text-lg">
            When you own shares of stock, your portfolio value changes with the stock price.
            <br><br>
            Let's see how this works...
          </p>
        </div>

        <div class="card mb-6">
          <h2 class="text-2xl font-bold mb-6">Simple Example</h2>

          <div class="bg-gray-900 p-6 rounded mb-6">
            <div class="text-lg mb-4">You own: <span class="text-matrix-green font-bold text-3xl">100 shares</span></div>
            <div class="text-lg mb-4">Stock price moves: <span class="text-matrix-green font-bold text-3xl">+$1</span></div>
            <div class="border-t border-gray-700 pt-4 mt-4">
              <div class="text-lg">Your portfolio gain:</div>
              <div class="text-5xl font-bold text-matrix-green mt-2">
                100 shares × $1 = $100
              </div>
            </div>
          </div>

          <div class="bg-yellow-900/30 border border-yellow-500 p-4 rounded">
            <p class="text-lg">
              💡 <strong>Key concept:</strong> Every $1 the stock moves = $1 per share you own.
            </p>
          </div>
        </div>

        <button id="next-btn" class="btn btn-primary w-full text-xl py-4">
          NEXT: Try It Yourself →
        </button>
      </div>
    `;
  }

  private renderStep2(): string {
    // Interactive: User adjusts sliders
    const value = this.calculateValue();
    const isPositive = this.state.priceChange >= 0;

    return `
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold mb-4">📚 Tutorial 0: Understanding Shares</h1>
        <h2 class="text-2xl text-matrix-green mb-6">Step 2: Try It Yourself</h2>

        <div class="card mb-6">
          <p class="text-lg mb-6">
            Adjust the sliders below to see how different amounts affect your gains/losses:
          </p>

          <!-- Shares Slider -->
          <div class="mb-6">
            <label class="block text-lg mb-3">
              Shares Owned: <span class="text-matrix-green font-bold">${this.state.sharesOwned}</span>
            </label>
            <input
              type="range"
              id="shares-slider"
              min="10"
              max="200"
              step="10"
              value="${this.state.sharesOwned}"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div class="flex justify-between text-sm text-gray-400 mt-1">
              <span>10 shares</span>
              <span>200 shares</span>
            </div>
          </div>

          <!-- Price Change Slider -->
          <div class="mb-6">
            <label class="block text-lg mb-3">
              Price Change: <span class="font-bold ${isPositive ? 'text-matrix-green' : 'text-red-400'}">
                ${isPositive ? '+' : ''}$${this.state.priceChange}
              </span>
            </label>
            <input
              type="range"
              id="price-slider"
              min="-10"
              max="10"
              step="1"
              value="${this.state.priceChange}"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div class="flex justify-between text-sm text-gray-400 mt-1">
              <span>-$10 (down)</span>
              <span>+$10 (up)</span>
            </div>
          </div>

          <!-- Result -->
          <div class="bg-gray-900 p-6 rounded border-2 ${isPositive ? 'border-matrix-green' : 'border-red-400'}">
            <div class="text-lg mb-2">Calculation:</div>
            <div class="text-2xl mb-4">
              ${this.state.sharesOwned} shares × $${this.state.priceChange} =
              <span class="font-bold ${isPositive ? 'text-matrix-green' : 'text-red-400'}">
                ${isPositive ? '+' : ''}$${value}
              </span>
            </div>
            <div class="text-lg">
              ${isPositive ? '📈 Profit!' : '📉 Loss!'}
            </div>
          </div>
        </div>

        <button id="next-btn" class="btn btn-primary w-full text-xl py-4">
          NEXT: Test Your Knowledge →
        </button>
      </div>
    `;
  }

  private renderStep3(): string {
    // Capital requirements: Share price × Quantity = Total cost
    const portfolioValue = this.state.sharesOwned * this.state.sharePrice;

    return `
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold mb-4">📚 Tutorial 0: Understanding Shares</h1>
        <h2 class="text-2xl text-matrix-green mb-6">Step 3: How Much Capital Do You Need?</h2>

        <div class="card mb-6">
          <div class="bg-yellow-900/30 border border-yellow-500 p-6 rounded mb-6">
            <p class="text-xl">
              <strong>Important:</strong> Before you can make money from price changes, you need to BUY the shares first!
            </p>
          </div>

          <p class="text-lg mb-6">
            To buy shares, you need capital (money). The total cost is:
          </p>

          <div class="bg-gray-900 p-6 rounded mb-6">
            <div class="text-center text-3xl font-bold mb-4">
              Share Price × Number of Shares = Total Capital Needed
            </div>
          </div>

          <!-- Interactive Example -->
          <div class="mb-6">
            <label class="block text-lg mb-3">
              Share Price: <span class="text-matrix-green font-bold">$${this.state.sharePrice}</span>
            </label>
            <input
              type="range"
              id="share-price-slider"
              min="100"
              max="1000"
              step="10"
              value="${this.state.sharePrice}"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div class="flex justify-between text-sm text-gray-400 mt-1">
              <span>$100/share</span>
              <span>$1,000/share</span>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-lg mb-3">
              Shares to Buy: <span class="text-matrix-green font-bold">${this.state.sharesOwned}</span>
            </label>
            <input
              type="range"
              id="shares-slider-3"
              min="10"
              max="200"
              step="10"
              value="${this.state.sharesOwned}"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div class="flex justify-between text-sm text-gray-400 mt-1">
              <span>10 shares</span>
              <span>200 shares</span>
            </div>
          </div>

          <!-- Result -->
          <div class="bg-gray-900 p-8 rounded border-2 border-matrix-green">
            <div class="text-lg mb-2">Calculation:</div>
            <div class="text-2xl mb-4">
              $${this.state.sharePrice} × ${this.state.sharesOwned} shares
            </div>
            <div class="text-lg mb-2">Total Capital Needed:</div>
            <div class="text-5xl font-bold text-matrix-green">
              $${portfolioValue.toLocaleString()}
            </div>
          </div>

          <div class="mt-6 bg-blue-900/30 border border-blue-500 p-4 rounded">
            <p class="text-lg">
              💡 <strong>This is important!</strong> If SPY is $590/share and you want to buy 85 shares, you need $${(590 * 85).toLocaleString()} in your account.
            </p>
          </div>
        </div>

        <button id="next-btn" class="btn btn-primary w-full text-xl py-4">
          NEXT: Test Your Knowledge →
        </button>
      </div>
    `;
  }

  private renderQuizStep(): string {
    const question = this.getCurrentQuestion();
    if (!question) return this.renderResults();

    const questionNumber = this.state.step - 3;

    return `
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold mb-4">📚 Tutorial 0: Understanding Shares</h1>
        <h2 class="text-2xl text-matrix-green mb-6">Quiz Question ${questionNumber} of ${this.state.totalQuestions}</h2>

        <div class="card mb-6">
          <div class="bg-blue-900/30 border border-blue-500 p-6 rounded mb-6">
            <p class="text-2xl font-bold mb-4">${question.text}</p>
          </div>

          <div class="bg-gray-900 p-6 rounded mb-6">
            <label class="block text-lg mb-3">Your Answer:</label>
            <div class="flex gap-4 items-center">
              <span class="text-2xl">$</span>
              <input
                type="number"
                id="answer-input"
                placeholder="Enter amount"
                value="${this.state.userAnswer}"
                class="flex-1 bg-gray-800 border border-gray-600 rounded px-4 py-3 text-2xl"
                autofocus
              />
            </div>
          </div>

          <div class="bg-yellow-900/30 border border-yellow-500 p-4 rounded">
            <p>💡 <strong>Hint:</strong> ${
              question.type === 'gain' ? 'Multiply shares × price change' :
              question.type === 'cost' ? 'Multiply share price × number of shares' :
              'Calculate new share price first, then multiply by shares'
            }</p>
          </div>
        </div>

        <button id="submit-btn" class="btn btn-primary w-full text-xl py-4">
          SUBMIT ANSWER
        </button>

        <div class="mt-4 text-center text-gray-400">
          Score: ${this.state.score} / ${questionNumber - 1}
        </div>
      </div>
    `;
  }

  private renderResults(): string {
    const percentage = Math.round((this.state.score / this.state.totalQuestions) * 100);
    const passed = percentage >= 80;

    return `
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold mb-4">📚 Tutorial 0: Understanding Shares</h1>
        <h2 class="text-2xl text-matrix-green mb-6">Results</h2>

        <div class="card mb-6">
          <div class="text-center mb-8">
            <div class="text-6xl mb-4">${passed ? '🎉' : '📝'}</div>
            <div class="text-5xl font-bold mb-4 ${passed ? 'text-matrix-green' : 'text-yellow-400'}">
              ${this.state.score} / ${this.state.totalQuestions}
            </div>
            <div class="text-3xl mb-4">${percentage}%</div>
            <div class="text-xl">
              ${passed ?
                'Excellent! You understand how shares work!' :
                'Not bad! Try again to master the basics.'}
            </div>
          </div>

          ${passed ? `
            <div class="bg-matrix-green text-black p-6 rounded font-bold text-center text-xl">
              ✓ You're ready to learn about LEAPS!
            </div>
          ` : `
            <div class="bg-yellow-900/30 border border-yellow-500 p-4 rounded text-center">
              Review: Shares × Price Change = Portfolio Change
            </div>
          `}
        </div>

        <div class="flex gap-4">
          <button id="retry-btn" class="btn flex-1 text-lg py-4">
            ↺ TRY AGAIN
          </button>
          ${passed ? `
            <button id="next-tutorial-btn" class="btn btn-primary flex-1 text-lg py-4">
              NEXT: Learn About Options →
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  private render(): void {
    let content = '';

    if (this.state.step === 1) {
      content = this.renderStep1();
    } else if (this.state.step === 2) {
      content = this.renderStep2();
    } else if (this.state.step === 3) {
      content = this.renderStep3();
    } else if (this.state.step <= 3 + this.state.totalQuestions) {
      content = this.renderQuizStep();
    } else {
      content = this.renderResults();
    }

    this.container.innerHTML = content;
  }

  private attachEventListeners(): void {
    // Next button
    const nextBtn = this.container.querySelector('#next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }

    // Shares slider
    const sharesSlider = this.container.querySelector<HTMLInputElement>('#shares-slider');
    if (sharesSlider) {
      sharesSlider.addEventListener('input', (e) => {
        this.state.sharesOwned = parseInt((e.target as HTMLInputElement).value);
        this.render();
        this.attachEventListeners();
      });
    }

    // Price slider
    const priceSlider = this.container.querySelector<HTMLInputElement>('#price-slider');
    if (priceSlider) {
      priceSlider.addEventListener('input', (e) => {
        this.state.priceChange = parseInt((e.target as HTMLInputElement).value);
        this.render();
        this.attachEventListeners();
      });
    }

    // Share price slider (for step 3)
    const sharePriceSlider = this.container.querySelector<HTMLInputElement>('#share-price-slider');
    if (sharePriceSlider) {
      sharePriceSlider.addEventListener('input', (e) => {
        this.state.sharePrice = parseInt((e.target as HTMLInputElement).value);
        this.render();
        this.attachEventListeners();
      });
    }

    // Shares slider for step 3
    const sharesSlider3 = this.container.querySelector<HTMLInputElement>('#shares-slider-3');
    if (sharesSlider3) {
      sharesSlider3.addEventListener('input', (e) => {
        this.state.sharesOwned = parseInt((e.target as HTMLInputElement).value);
        this.render();
        this.attachEventListeners();
      });
    }

    // Answer input
    const answerInput = this.container.querySelector<HTMLInputElement>('#answer-input');
    if (answerInput) {
      answerInput.addEventListener('input', (e) => {
        this.state.userAnswer = (e.target as HTMLInputElement).value;
      });

      // Submit on Enter key
      answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.submitAnswer();
        }
      });
    }

    // Submit button
    const submitBtn = this.container.querySelector('#submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submitAnswer());
    }

    // Retry button
    const retryBtn = this.container.querySelector('#retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.state.step = 1;
        this.state.score = 0;
        this.state.userAnswer = '';
        this.render();
        this.attachEventListeners();
      });
    }

    // Next tutorial button
    const nextTutorialBtn = this.container.querySelector('#next-tutorial-btn');
    if (nextTutorialBtn) {
      nextTutorialBtn.addEventListener('click', () => {
        console.log('Moving to Tutorial 1 - not implemented yet');
      });
    }
  }
}
