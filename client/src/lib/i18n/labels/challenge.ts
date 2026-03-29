/**
 * @brief Challenge and hardcore mode labels
 * @description Labels specific to challenge and hardcore game modes
 */

export const CHALLENGE_LABELS = {
    en: {
        challengeMode: 'Challenge Mode',
        tenQuestionsChallenge: '10 consecutive questions - see your score only at the end',
        reviewAnswers: 'Review Answers',
        yourAnswer: 'Your answer',
        correctAnswer: 'Correct answer',
        hardcoreMode: 'Hardcore Mode',
        typeThePokemonName: 'Type the Pokémon name (in the current language)'
    },
    fr: {
        challengeMode: 'Mode Défi',
        tenQuestionsChallenge: '10 questions consécutives - découvrez votre score à la fin',
        reviewAnswers: 'Examinez vos réponses',
        yourAnswer: 'Votre réponse',
        correctAnswer: 'Bonne réponse',
        hardcoreMode: 'Mode Hardcore',
        typeThePokemonName: 'Tapez le nom du Pokémon (dans la langue actuelle)'
    },
    de: {
        challengeMode: 'Herausforderungsmodus',
        tenQuestionsChallenge: '10 aufeinanderfolgende Fragen - Ihr Ergebnis nur am Ende',
        reviewAnswers: 'Antworten überprüfen',
        yourAnswer: 'Ihre Antwort',
        correctAnswer: 'Richtige Antwort',
        hardcoreMode: 'Hardcore-Modus',
        typeThePokemonName: 'Geben Sie den Pokémon-Namen ein (in der aktuellen Sprache)'
    },
    es: {
        challengeMode: 'Modo Desafío',
        tenQuestionsChallenge: '10 preguntas consecutivas - ve tu puntuación solo al final',
        reviewAnswers: 'Revisa tus respuestas',
        yourAnswer: 'Tu respuesta',
        correctAnswer: 'Respuesta correcta',
        hardcoreMode: 'Modo Hardcore',
        typeThePokemonName: 'Escriba el nombre del Pokémon (en el idioma actual)'
    },
    it: {
        challengeMode: 'Modalità Sfida',
        tenQuestionsChallenge: '10 domande consecutive - scopri il tuo punteggio solo alla fine',
        reviewAnswers: 'Rivedi le tue risposte',
        yourAnswer: 'La tua risposta',
        correctAnswer: 'Risposta corretta',
        hardcoreMode: 'Modalità Hardcore',
        typeThePokemonName: 'Digita il nome del Pokémon (nella lingua attuale)'
    },
    'ja-hrkt': {
        challengeMode: 'ちゃれんじ もーど',
        tenQuestionsChallenge: '10の れんぞくした もんだい - さいご に のみ すこあ を みる',
        reviewAnswers: 'あなた の こたえ を かくにん する',
        yourAnswer: 'あなた の こたえ',
        correctAnswer: 'せいかい',
        hardcoreMode: 'はーどこあ もーど',
        typeThePokemonName: 'ぽけもん の なまえ を にゅうりょく してください（げんざい の げんご）'
    },
    ja: {
        challengeMode: 'チャレンジモード',
        tenQuestionsChallenge: '10の連続した問題-最後にのみスコアを見る',
        reviewAnswers: 'あなたの答えを確認する',
        yourAnswer: 'あなたの答え',
        correctAnswer: '正解',
        hardcoreMode: 'ハードコアモード',
        typeThePokemonName: 'ポケモンの名前を入力してください（現在の言語）'
    },
    ko: {
        challengeMode: '챌린지 모드',
        tenQuestionsChallenge: '10개의 연속 문제 - 끝에서만 점수 확인',
        reviewAnswers: '답변 검토',
        yourAnswer: '당신의 답',
        correctAnswer: '정답',
        hardcoreMode: '하드코어 모드',
        typeThePokemonName: '포켓몬 이름 입력(현재 언어)'
    },
    'zh-hans': {
        challengeMode: '挑战模式',
        tenQuestionsChallenge: '10个连续问题 - 最后只看你的分数',
        reviewAnswers: '查看你的答案',
        yourAnswer: '你的答案',
        correctAnswer: '正确答案',
        hardcoreMode: '硬核模式',
        typeThePokemonName: '输入口袋妖怪的名字（用当前语言）'
    },
    'zh-hant': {
        challengeMode: '挑戰模式',
        tenQuestionsChallenge: '10個連續問題 - 最後只看你的分數',
        reviewAnswers: '查看你的答案',
        yourAnswer: '你的答案',
        correctAnswer: '正確答案',
        hardcoreMode: '硬核模式',
        typeThePokemonName: '輸入口袋妖怪的名字（用當前語言）'
    }
} as const;

export type ChallengeLabelKey = keyof typeof CHALLENGE_LABELS.en;
