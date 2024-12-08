const fs = require("fs")
const path = require("path")

// Путь к файлу кеша в /tmp
const CACHE_FILE = path.join("/tmp", "cache.json")

// Инициализация файла кеша, если его нет
function initCache() {
  if (!fs.existsSync(CACHE_FILE)) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify([]), "utf-8")
  }
}

// Функция для добавления URL в кеш
function addToCache(url) {
  initCache()
  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"))
  if (!cache.includes(url)) {
    cache.push(url)
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8")
  }
}

// Функция для проверки, есть ли URL в кеше
function isInCache(url) {
  initCache()
  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"))
  return cache.includes(url)
}

// Экспорт функций
module.exports = { addToCache, isInCache }
