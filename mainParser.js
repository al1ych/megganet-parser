const axios = require("axios")
const cheerio = require("cheerio")
const { parsePost } = require("./postParser")
const { addToCache, isInCache } = require("./cache")

async function getPostMeta(url, city) {
  try {
    // Устанавливаем таймаут в 3 секунды
    const { data } = await axios.get(url, { timeout: 10 * 1000 }) // Таймаут в миллисекундах
    const $ = cheerio.load(data)
    const news = []

    $("a.sc-k5zf9p-3").each((i, element) => {
      const title = $(element).text().trim()
      const link = $(element).attr("href")

      if (title && link) {
        news.push({
          title,
          link: link.startsWith("http") ? link : `${url}${link.slice(1)}`,
          city,
        })
      }
    })

    return news
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      console.error(`Таймаут запроса на ${url}: превышено время ожидания`)
    } else {
      console.error(`Ошибка при получении данных с ${url}:`, error.message)
    }
    return [] // Возвращаем пустой список при таймауте или ошибке
  }
}
const fetchLatestNewsFromWebsites = async websites => {
  const newsPromises = websites.map(website => {
    console.log("Processing", website)
    return getPostMeta(website.url, website.city)
  })
  const newsResults = await Promise.all(newsPromises)
  return newsResults.flat()
}

const fetchLatestNewsFromWebsitesSeq = async websites => {
  const newsResults = []

  for await (const website of websites) {
    console.log("Processing", website)
    try {
      const news = await getPostMeta(website.url, website.city)
      newsResults.push(...news)
    } catch (error) {
      console.error(`Ошибка при обработке ${website.url}:`, error)
    }
  }

  return newsResults
}

async function submitPost(post) {
  const baseUrl = "https://megganet.ru"
  const url = `${baseUrl}/gpt_news`

  let retries = 0
  const max_retries = 20

  while (retries++ < max_retries) {
    try {
      console.log(`Попытка отправить данные на сервер: ${url}`)
      const response = await axios.post(url, post)

      console.log("статус получен:", response.status)
      // Если статус 200, но в теле есть поле error — выходим из цикла
      if (response.status === 200) {
        if (response.data && response.data.error) {
          console.error(
            "Сервер вернул ошибку в теле ответа:",
            response.data.error
          )
          break
        }
        console.log("Запрос успешно выполнен:", response.data)
        return response
      }

      console.log(`Неожиданный статус ответа: ${response.status}`)
    } catch (error) {
      if (error.response) {
        const status = error.response.status

        // 5xx: продолжаем ретраить
        if (status >= 500 && status < 600) {
          console.error(
            `Ошибка сервера (статус ${status}). Повторная попытка через 1 минуту...`
          )
        }
        // 4xx: прерываем цикл
        else if (status >= 400 && status < 500) {
          console.error(
            `Ошибка клиента (статус ${status}). Прерываем отправку.`
          )
          break
        }
      } else {
        console.error(
          "Ошибка сети или нераспознанный ответ. Повторная попытка через 1 минуту..."
        )
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1 * 60 * 1000)) // Пауза 1 минута
  }
  console.error("Достигнуто максимальное количество попыток отправки.")
  return null
}

// Основная функция
;(async () => {
  // локал на тест
  // while (true) {
  const websites = [
    { url: "https://www.kp.ru/", city: undefined },
    { url: "https://belarus.kp.ru/", city: "Беларусь" },
    { url: "https://kp.kz/", city: "Казахстан" },
    { url: "https://kp.kg/", city: "Кыргызстан" },
    { url: "https://md.kp.media/", city: "Молдова" },
    { url: "https://ural.kp.ru/", city: "Екатеринбург" },
    { url: "https://kazan.kp.ru/", city: "Казань" },
    { url: "https://kuban.kp.ru/", city: "Краснодар" },
    { url: "https://msk.kp.ru/", city: "Москва" },
    { url: "https://nnov.kp.ru/", city: "Нижний Новгород" },
    { url: "https://nsk.kp.ru/", city: "Новосибирск" },
    { url: "https://perm.kp.ru/", city: "Пермь" },
    { url: "https://samara.kp.ru/", city: "Самара" },
    { url: "https://spb.kp.ru/", city: "Санкт-Петербург" },
    { url: "https://chel.kp.ru/", city: "Челябинск" },
    { url: "https://astrakhan.kp.ru/", city: "Астрахань" },
    { url: "https://alt.kp.ru/", city: "Барнаул" },
    { url: "https://bel.kp.ru/", city: "Белгород" },
    { url: "https://eao.kp.ru/", city: "Биробиджан" },
    { url: "https://amur.kp.ru/", city: "Благовещенск" },
    { url: "https://bryansk.kp.ru/", city: "Брянск" },
    { url: "https://vladimir.kp.ru/", city: "Владимир" },
    { url: "https://volgograd.kp.ru/", city: "Волгоград" },
    { url: "https://vologda.kp.ru/", city: "Вологда" },
    { url: "https://vrn.kp.ru/", city: "Воронеж" },
    { url: "https://dv.kp.ru/", city: "Дальний Восток" },
    { url: "https://donetsk.kp.ru/", city: "Донецк" },
    { url: "https://zap.kp.ru/", city: "Запорожье" },
    { url: "https://izh.kp.ru/", city: "Ижевск" },
    { url: "https://irk.kp.ru/", city: "Иркутск" },
    { url: "https://kaliningrad.kp.ru/", city: "Калининград" },
    { url: "https://kaluga.kp.ru/", city: "Калуга" },
    { url: "https://kamchatka.kp.ru/", city: "Камчатка" },
    { url: "https://kem.kp.ru/", city: "Кемерово" },
    { url: "https://kirov.kp.ru/", city: "Киров" },
    { url: "https://kostroma.kp.ru/", city: "Кострома" },
    { url: "https://krsk.kp.ru/", city: "Красноярск" },
    { url: "https://crimea.kp.ru/", city: "Крым" },
    { url: "https://kursk.kp.ru/", city: "Курск" },
    { url: "https://lipetsk.kp.ru/", city: "Липецк" },
    { url: "https://lugansk.kp.ru/", city: "Луганск" },
    { url: "https://magadan.kp.ru/", city: "Магадан" },
    { url: "https://mosobl.kp.ru/", city: "Московская область" },
    { url: "https://murmansk.kp.ru/", city: "Мурманск" },
    { url: "https://omsk.kp.ru/", city: "Омск" },
    { url: "https://orel.kp.ru/", city: "Орел" },
    { url: "https://orenburg.kp.ru/", city: "Оренбург" },
    { url: "https://penza.kp.ru/", city: "Пенза" },
    { url: "https://pskov.kp.ru/", city: "Псков" },
    { url: "https://rostov.kp.ru/", city: "Ростов-на-Дону" },
    { url: "https://ryazan.kp.ru/", city: "Рязань" },
    { url: "https://saratov.kp.ru/", city: "Саратов" },
    { url: "https://sakhalin.kp.ru/", city: "Сахалин" },
    { url: "https://sevastopol.kp.ru/", city: "Севастополь" },
    { url: "https://stav.kp.ru/", city: "Северный Кавказ" },
    { url: "https://smol.kp.ru/", city: "Смоленск" },
    { url: "https://komi.kp.ru/", city: "Сыктывкар" },
    { url: "https://tambov.kp.ru/", city: "Тамбов" },
    { url: "https://tver.kp.ru/", city: "Тверь" },
    { url: "https://tomsk.kp.ru/", city: "Томск" },
    { url: "https://tula.kp.ru/", city: "Тула" },
    { url: "https://tumen.kp.ru/", city: "Тюмень" },
    { url: "https://ulan.kp.ru/", city: "Улан-Удэ" },
    { url: "https://ul.kp.ru/", city: "Ульяновск" },
    { url: "https://ufa.kp.ru/", city: "Уфа" },
    { url: "https://hab.kp.ru/", city: "Хабаровск" },
    { url: "https://herson.kp.ru/", city: "Херсон" },
    { url: "https://chita.kp.ru/", city: "Чита" },
    { url: "https://chukotka.kp.ru/", city: "Чукотка" },
    { url: "https://ugra.kp.ru/", city: "Югра" },
    { url: "https://yakutia.kp.ru/", city: "Якутия" },
    { url: "https://yamal.kp.ru/", city: "Ямал" },
    { url: "https://yar.kp.ru/", city: "Ярославль" },
  ]

  const latestNews = await fetchLatestNewsFromWebsites(websites)

  console.log("Processed all latest news", latestNews.length)

  if (latestNews.length === 0) {
    console.log("Не удалось получить последние новости.")
  } else {
    console.log(`Последние новости (${latestNews.length}):`)
    let t = 0
    for (const [index, newsItem] of latestNews.entries()) {
      // if (t++ === 60) break

      // Проверяем, есть ли новость в кеше
      if (isInCache(newsItem.link)) {
        console.log(`Пост уже в кеше, пропускаем: ${newsItem.link}`)
        continue
      }

      // Парсим новость
      const postData = await parsePost({ url: newsItem.link })

      if (!postData) {
        console.log(`Не удалось получить данные для: ${newsItem.link}`)
        continue
      }

      postData.city = newsItem.city
      newsItem.post = postData
      console.log(`${index + 1} Пост:`)
      console.log(JSON.stringify(postData, null, 2))

      try {
        await submitPost(postData)
        addToCache(newsItem.link) // Сохраняем в кеш, если успешно отправлено
      } catch (e) {
        console.log("Не удалось отправить беку")
      }
    }
  }
  // }
})()
