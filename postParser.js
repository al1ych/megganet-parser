const axios = require("axios")
const cheerio = require("cheerio")
const { classifyPost, rewriteText } = require("./gpt")

async function parsePost({ url }) {
  try {
    // Загружаем страницу
    const { data } = await axios.get(url)
    const $ = cheerio.load(data)

    // Заголовок и подзаголовок
    const title = $("h1").text().trim()
    const subtitle = $(".sc-j7em19-4").text().trim()

    // Дата публикации
    const createdAt = $("span.sc-j7em19-1").text().trim()

    // Автор статьи
    const author = $("a.sc-1jl27nw-4, .sc-1jl27nw-1").first().text().trim()

    // Сбор изображений с caption и текста
    const images = []
    let fullTextBody = "" // Полный текст статьи

    let skipText = false // Флаг для игнорирования части текста

    $(".sc-1wayp1z-0 p, .sc-1wayp1z-2 picture").each((_, elem) => {
      if ($(elem).is("p")) {
        const text = $(elem).text().trim()

        if (text.includes("Следите ")) {
          skipText = true
        }

        if (!skipText && text) {
          fullTextBody += `${text} `
        }
      } else if ($(elem).is("picture")) {
        const img = $(elem).find("img")
        const url = img.attr("src")
        const caption = img.attr("alt") || ""

        // Проверка на дубликат caption
        if (
          url &&
          caption &&
          !images.some(image => image.caption === caption)
        ) {
          images.push({ url, caption })
        }
      }
    })

    // Получаем категории и переписываем текст
    const category = await classifyPost(fullTextBody.trim())
    const text = await rewriteText(fullTextBody.trim())

    // Итоговая структура
    return {
      title,
      subtitle,
      source: url,
      createdAt,
      author,
      text,
      images,
      spheres: category,
    }
  } catch (error) {
    console.error("Ошибка при парсинге:", error)
    return null
  }
}

module.exports = { parsePost }
