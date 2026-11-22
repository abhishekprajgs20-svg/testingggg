# 3.1.0
New files: src/translate.js, src/figures.js, src/ai-modes.js, src/ai-assist.js.
Changed: main.js (translator delegate, language picker, nav stack/back, generator types & explanation styles, figure rendering, OMR fit, doubt box, backup), extras.js (reasoning source + explanation styles in the section builder), ai.js (central AI-answer logger hook; aiCall wrapped, behaviour unchanged), style.css, public/tools/txt-pdf-translator.html (robust requests, retry pass), upsc/doubt.js (noLog).
Data: new optional keys `db.aiChats` (history), question field `fig` (figure spec). Old data loads unchanged.
