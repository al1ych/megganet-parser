require("dotenv").config() // Подключаем dotenv
const axios = require("axios")

// Категории для классификации новостей
const categories = [
  "Мой район, улица, двор",
  "Власть и закон",
  "Общество и право",
  "Производство и экономика",
  "Строительство и ЖКХ",
  "Бизнес",
  "Медицина и здоровье",
  "Образование и наука",
  "Культура, искусство, дизайн",
  "Психология, религия, мораль",
  "СМИ и технологии",
  "Развлечения и досуг",
  "Спорт и активный образ жизни",
  "Семья и отношения",
  "Семейный быт: квартира, дача",
  "Увлечения и хобби",
  "Экология и естественная среда",
]

// Функция для вызова ChatGPT и определения категории новости
async function classifyPost(text) {
  const systemMessage = `
    Ты классификатор новостей. Твоя задача - определить категорию новости на основании её заголовка.
    Возможные категории: ${categories.join(", ")}.
    Ответь только категорией, категорий может быть 1, 2 или 3.
    Раздели свой ответ знаком пайпа (|) для разделения между выделенными категориями.
    Никакого объяснения не требуется.
  `
  const userMessage = `Заголовок новости: "${text}". Какая это категория?`

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        max_tokens: 20,
        temperature: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Берём ключ из .env
        },
      }
    )

    const rawCategories = response.data.choices[0].message.content.trim()
    const cats = rawCategories.split("|")
    return cats
  } catch (error) {
    console.error("Ошибка при вызове ChatGPT API:", error)
    return ["Unknown"]
  }
}

// Новая функция для переписывания текста
async function rewriteText(originalText) {
  const systemMessage = `
    Ты редактор текстов. Твоя задача - переписать текст так, чтобы он стал уникальным, сохранил смысл и был более читаемым.
    Значительно перефразируй его, используя новые обороты и выражения.
    Используй другие обороты речи, но меняй последовательность изложения, факты
    Не добавляй ничего нового, а просто улучшай и перефразируй текст.
    Допускается менять местами предложения, абзацы, можно опускать какую-то мало значимую информацию.
    Старайся создать текст, который будет максимально не похож на оригинал.
    Исключи из текста упомянания о авторе фотографии и вообще про то, кем сделано какое-то фото, если это не относится к смыслу статьи.
    Исключи из текста отсылки к КП (Комсомольская правда), к социальным сетям КП и подобному, не упомянай источник новости.
  `

  const userMessage = `Перепиши следующий текст:\n"${originalText}"`

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Берём ключ из .env
        },
      }
    )

    return response.data.choices[0].message.content.trim()
  } catch (error) {
    console.error("Ошибка при переписывании текста:", error)
    return originalText // Возвращаем оригинальный текст при ошибке
  }
}

module.exports = { classifyPost, rewriteText }
