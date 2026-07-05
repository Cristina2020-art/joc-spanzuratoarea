(function(){
  const WORDS = {
    usor: {
      label:"Ușor", maxWrong:8, category:"noțiuni generale de calculator",
      list:["CALCULATOR","MOUSE","TASTATURA","MONITOR","INTERNET","PAROLA","ECRAN","RETEA","FISIER","IMPRIMANTA","APLICATIE","BROWSER"]
    },
    mediu: {
      label:"Mediu", maxWrong:6, category:"programare și hardware",
      list:["ALGORITM","VARIABILA","FUNCTIE","BUCLA","VECTOR","COMPILATOR","PROCESOR","SOFTWARE","HARDWARE","PROTOCOL","DATABASE","LIMBAJ"]
    },
    dificil: {
      label:"Dificil", maxWrong:4, category:"concepte avansate & securitate cibernetică",
      list:["RECURSIVITATE","POLIMORFISM","INCAPSULARE","MOSTENIRE","CRIPTOGRAFIE","BLOCKCHAIN","AUTENTIFICARE","VIRTUALIZARE","COMPILARE","ALGORITMICA"]
    }
  };

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  let state = {
    diff:null,
    word:"",
    guessed:new Set(),
    wrong:0,
    maxWrong:8,
    over:false
  };

  const screenStart = document.getElementById('screen-start');
  const screenGame = document.getElementById('screen-game');
  const badgeDiff = document.getElementById('badge-diff');
  const categoryTag = document.getElementById('category-tag');
  const wordDisplay = document.getElementById('word-display');
  const feedback = document.getElementById('feedback');
  const livesCount = document.getElementById('lives-count');
  const keyboardEl = document.getElementById('keyboard');
  const letterInput = document.getElementById('letter-input');

  const figureParts = ["p-head","p-body","p-armL","p-armR","p-legL","p-legR","p-face"];

  let lastWord = null;

  function pickWord(diffKey){
    const arr = WORDS[diffKey].list;
    let word;
    do{
      word = arr[Math.floor(Math.random()*arr.length)];
    } while(word === lastWord && arr.length > 1);
    lastWord = word;
    return word;
  }

  function startGame(diffKey){
    const cfg = WORDS[diffKey];
    state = {
      diff:diffKey,
      word: pickWord(diffKey),
      guessed:new Set(),
      wrong:0,
      maxWrong:cfg.maxWrong,
      over:false
    };
    badgeDiff.textContent = cfg.label;
    badgeDiff.className = "badge " + diffKey;
    categoryTag.textContent = "categorie: " + cfg.category;
    livesCount.textContent = state.maxWrong;
    feedback.className = "feedback info";
    feedback.textContent = "Introdu o literă pentru a începe.";
    resetFigure();
    renderWord();
    buildKeyboard();
    screenStart.style.display = "none";
    screenGame.style.display = "block";
    letterInput.value = "";
    letterInput.focus();
  }

  function resetFigure(){
    figureParts.forEach(id=>{
      document.getElementById(id).style.opacity = "0";
    });
  }

  function updateFigure(){
    const totalStages = figureParts.length;
    const stagesToShow = Math.min(totalStages, Math.ceil((state.wrong/state.maxWrong)*totalStages));
    figureParts.forEach((id,i)=>{
      document.getElementById(id).style.opacity = i < stagesToShow ? "1" : "0";
    });
  }

  function renderWord(){
    wordDisplay.innerHTML = "";
    state.word.split("").forEach(ch=>{
      const box = document.createElement('div');
      box.className = "letter-box" + (state.guessed.has(ch) ? " filled" : "");
      box.textContent = state.guessed.has(ch) ? ch : "";
      wordDisplay.appendChild(box);
    });
  }

  function buildKeyboard(){
    keyboardEl.innerHTML = "";
    ALPHABET.forEach(letter=>{
      const btn = document.createElement('button');
      btn.className = "key";
      btn.textContent = letter;
      btn.addEventListener('click', ()=>guessLetter(letter));
      keyboardEl.appendChild(btn);
    });
  }

  function setKeyState(letter, correct){
    const keys = keyboardEl.querySelectorAll('.key');
    keys.forEach(k=>{
      if(k.textContent === letter){
        k.disabled = true;
        k.classList.add(correct ? "correct" : "wrong");
      }
    });
  }

  function guessLetter(letterRaw){
    if(state.over) return;
    const letter = (letterRaw||"").toUpperCase().trim();
    if(!letter || letter.length !== 1 || !/[A-Z]/.test(letter)) {
      feedback.className = "feedback bad";
      feedback.textContent = "Introdu o singură literă (A-Z).";
      return;
    }
    if(state.guessed.has(letter)){
      feedback.className = "feedback info";
      feedback.textContent = "Ai încercat deja litera \"" + letter + "\".";
      return;
    }
    state.guessed.add(letter);

    if(state.word.includes(letter)){
      setKeyState(letter, true);
      feedback.className = "feedback ok";
      feedback.textContent = "Corect! Litera \"" + letter + "\" există în cuvânt.";
      renderWord();
      checkWin();
    } else {
      setKeyState(letter, false);
      state.wrong++;
      livesCount.textContent = Math.max(0, state.maxWrong - state.wrong);
      feedback.className = "feedback bad";
      feedback.textContent = "Greșit! Litera \"" + letter + "\" nu apare în cuvânt.";
      updateFigure();
      checkLose();
    }
    letterInput.value = "";
    letterInput.focus();
  }

  function checkWin(){
    const solved = state.word.split("").every(ch => state.guessed.has(ch));
    if(solved){
      state.over = true;
      showEnd(true);
    }
  }

  function checkLose(){
    if(state.wrong >= state.maxWrong){
      state.over = true;
      showEnd(false);
    }
  }

  function showEnd(won){
    const overlay = document.getElementById('overlay-end');
    document.getElementById('end-icon').textContent = won ? "🎉" : "💀";
    document.getElementById('end-title').textContent = won ? "Felicitări! Ai câștigat!" : "Ai pierdut!";
    document.getElementById('end-text').innerHTML = (won
      ? "Ai ghicit corect cuvântul: "
      : "Cuvântul era: ") + '<span class="word-reveal">' + state.word + '</span>';
    overlay.classList.add('show');
  }

  // ---- events ----
  document.querySelectorAll('.diff-card').forEach(card=>{
    card.addEventListener('click', ()=> startGame(card.dataset.diff));
  });

  document.getElementById('btn-submit').addEventListener('click', ()=> guessLetter(letterInput.value));
  letterInput.addEventListener('keydown', (e)=>{
    if(e.key === "Enter") guessLetter(letterInput.value);
  });

  document.getElementById('btn-new').addEventListener('click', ()=> startGame(state.diff));

  document.getElementById('btn-play-again').addEventListener('click', ()=>{
    document.getElementById('overlay-end').classList.remove('show');
    startGame(state.diff);
  });
  document.getElementById('btn-change-diff').addEventListener('click', ()=>{
    document.getElementById('overlay-end').classList.remove('show');
    screenGame.style.display = "none";
    screenStart.style.display = "block";
  });

  // close game flow
  document.getElementById('btn-close').addEventListener('click', ()=>{
    document.getElementById('overlay-close').classList.add('show');
  });
  document.getElementById('btn-close-cancel').addEventListener('click', ()=>{
    document.getElementById('overlay-close').classList.remove('show');
  });
  document.getElementById('btn-close-confirm').addEventListener('click', ()=>{
    document.getElementById('overlay-close').classList.remove('show');
    document.getElementById('overlay-bye').classList.add('show');
  });
  document.getElementById('btn-restart-all').addEventListener('click', ()=>{
    document.getElementById('overlay-bye').classList.remove('show');
    screenGame.style.display = "none";
    screenStart.style.display = "block";
  });
})();
