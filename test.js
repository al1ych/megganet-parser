
const { parse } = require("./mainParser")

async function test()  {
  try {
    await parse() // Вызов функции вашего парсера
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Парсер успешно выполнен!" }),
    }
  } catch (e) {
    console.error("Error starting parser:", e)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e }),
    }
  }
}

test()