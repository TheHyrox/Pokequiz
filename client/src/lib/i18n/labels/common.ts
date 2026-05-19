/**
 * @brief Common UI labels used throughout the application
 * @description Basic labels like back, loading, submit, etc.
 */

export const COMMON_LABELS = {
    en: {
        pokequiz: 'Pokequiz',
        testYourKnowledge: 'Test your Pokemon knowledge!',
        back: '← Back',
        loading: 'Loading...',
        language: 'Language',
        submit: 'Submit',
        correct: 'Correct!',
        incorrect: 'Incorrect!'
    },
    fr: {
        pokequiz: 'Pokequiz',
        testYourKnowledge: 'Testez vos connaissances Pokémon!',
        back: '← Retour',
        loading: 'Chargement...',
        language: 'Langue',
        submit: 'Soumettre',
        correct: 'Correct!',
        incorrect: 'Incorrect!'
    },
    de: {
        pokequiz: 'Pokequiz',
        testYourKnowledge: 'Testen Sie Ihr Pokémon-Wissen!',
        back: '← Zurück',
        loading: 'Wird geladen...',
        language: 'Sprache',
        submit: 'Absenden',
        correct: 'Richtig!',
        incorrect: 'Falsch!'
    },
    es: {
        pokequiz: 'Pokequiz',
        testYourKnowledge: '¡Prueba tu conocimiento de Pokémon!',
        back: '← Atrás',
        loading: 'Cargando...',
        language: 'Idioma',
        submit: 'Enviar',
        correct: '¡Correcto!',
        incorrect: '¡Incorrecto!'
    },
    it: {
        pokequiz: 'Pokequiz',
        testYourKnowledge: 'Metti alla prova le tue conoscenze Pokémon!',
        back: '← Indietro',
        loading: 'Caricamento...',
        language: 'Lingua',
        submit: 'Invia',
        correct: 'Corretto!',
        incorrect: 'Sbagliato!'
    },
    'ja-hrkt': {
        pokequiz: 'ぽけくいず',
        testYourKnowledge: 'あなたのぽけもん ちしきをてすとしてください!',
        back: '← もどる',
        loading: 'よみこみちゅう...',
        language: 'げんご',
        submit: 'ていしゅつ',
        correct: 'せいかい!',
        incorrect: 'ふせいかい!'
    },
    ja: {
        pokequiz: 'ポケクイズ',
        testYourKnowledge: 'あなたのポケモン知識をテストしてください!',
        back: '← 戻る',
        loading: '読み込み中...',
        language: '言語',
        submit: '提出',
        correct: '正解!',
        incorrect: '不正解!'
    },
    ko: {
        pokequiz: '포케퀴즈',
        testYourKnowledge: '포켓몬 지식을 테스트하세요!',
        back: '← 뒤로',
        loading: '로딩 중...',
        language: '언어',
        submit: '제출',
        correct: '정답!',
        incorrect: '오답!'
    },
    'zh-hans': {
        pokequiz: '口袋妖怪测验',
        testYourKnowledge: '测试您的口袋妖怪知识!',
        back: '← 返回',
        loading: '加载中...',
        language: '语言',
        submit: '提交',
        correct: '正确!',
        incorrect: '错误!'
    },
    'zh-hant': {
        pokequiz: '口袋妖怪測驗',
        testYourKnowledge: '測試您的口袋妖怪知識!',
        back: '← 返回',
        loading: '加載中...',
        language: '語言',
        submit: '提交',
        correct: '正確!',
        incorrect: '錯誤!'
    }
} as const;

export type CommonLabelKey = keyof typeof COMMON_LABELS.en;
