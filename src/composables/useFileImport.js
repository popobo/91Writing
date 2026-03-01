import { ref, computed } from 'vue'

/**
 * 导入小说用：读文件、章节检测、生成 novel 用 chapterList
 * 与拆书工具（BookAnalysis）逻辑一致，便于复用
 */

const chapterRegex = /(第[一二三四五六七八九十百千万\d]+[章节]|Chapter\s*\d+)/gi

/**
 * 读取文件内容（TXT 支持编码，DOCX 用 UTF-8）
 * @param {File} file
 * @param {string} encoding - 'utf-8' | 'gbk'
 * @returns {Promise<string>}
 */
export function readFileContent(file, encoding = 'utf-8') {
  return new Promise((resolve, reject) => {
    const isDocx = file.name.toLowerCase().endsWith('.docx')
    const fileEncoding = isDocx ? 'utf-8' : (encoding === 'gbk' ? 'GBK' : 'UTF-8')

    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target.result)
    }
    reader.onerror = () => {
      reject(new Error('文件读取失败，请检查文件编码或格式'))
    }
    reader.readAsText(file, fileEncoding)
  })
}

/**
 * 正则检测章节：第N章 / Chapter N
 * @param {string} bookContent
 * @returns {Array<{ index: number, title: string, startLine: number, wordCount: number }>}
 */
export function detectChapters(bookContent) {
  if (!bookContent || !bookContent.trim()) return []

  const lines = bookContent.split('\n')
  const chapters = []
  let currentChapter = null
  let currentContent = ''

  lines.forEach((line, index) => {
    const match = line.match(chapterRegex)
    if (match) {
      if (currentChapter) {
        currentChapter.wordCount = currentContent.length
        chapters.push(currentChapter)
      }
      currentChapter = {
        index: chapters.length,
        title: line.trim() || `第${chapters.length + 1}章`,
        startLine: index,
        wordCount: 0
      }
      currentContent = ''
    } else if (currentChapter) {
      currentContent += line + '\n'
    }
  })

  if (currentChapter) {
    currentChapter.wordCount = currentContent.length
    chapters.push(currentChapter)
  }

  return chapters
}

/**
 * 根据 startLine 取一章正文（正则检测结果）
 * @param {Object} chapter - { startLine, title, index }
 * @param {string} bookContent
 * @param {Array} allChapters - 同 detectChapters 返回的数组
 * @returns {string}
 */
function getChapterContentByLines(chapter, bookContent, allChapters) {
  const lines = bookContent.split('\n')
  const nextChapter = allChapters.find((c) => c.index === chapter.index + 1)
  const endLine = nextChapter ? nextChapter.startLine : lines.length
  return lines.slice(chapter.startLine, endLine).join('\n').trim()
}

/**
 * 生成小说用的 chapterList（与 NovelManagement / Writer 结构一致）
 * @param {string} bookContent
 * @param {{ mode: 'regex' | 'single', detectedChapters?: Array }} options
 * @returns {Array<{ id: number, title: string, description: string, content: string, wordCount: number, status: string, createdAt: Date, updatedAt: Date }>}
 */
export function buildChapterListForNovel(bookContent, options = {}) {
  const { mode = 'regex', detectedChapters = [] } = options
  const now = new Date()

  if (mode === 'single') {
    const content = (bookContent || '').trim()
    return [
      {
        id: Date.now(),
        title: '全文',
        description: '',
        content,
        wordCount: content.length,
        status: 'draft',
        createdAt: now,
        updatedAt: now
      }
    ]
  }

  // mode === 'regex'
  const chapters = detectedChapters.length > 0 ? detectedChapters : detectChapters(bookContent)
  if (chapters.length === 0) {
    // 未检测到章节则整本为一章
    const content = (bookContent || '').trim()
    return [
      {
        id: Date.now(),
        title: '全文',
        description: '',
        content,
        wordCount: content.length,
        status: 'draft',
        createdAt: now,
        updatedAt: now
      }
    ]
  }

  return chapters.map((ch, index) => {
    const content = getChapterContentByLines(ch, bookContent, chapters)
    return {
      id: Date.now() + index,
      title: ch.title,
      description: '',
      content,
      wordCount: content.length,
      status: 'draft',
      createdAt: now,
      updatedAt: now
    }
  })
}

/**
 * Composable：在组件内使用，带响应式状态
 * @returns {{ bookContent, uploadedFile, selectedEncoding, detectedChapters, chapterMode, readFile, setEncoding, setChapterMode, buildChapterList, reset }}
 */
export function useFileImport() {
  const bookContent = ref('')
  const uploadedFile = ref(null)
  const selectedEncoding = ref('utf-8')
  const chapterMode = ref('regex') // 'regex' | 'single'

  const totalWordCount = computed(() => (bookContent.value || '').length)
  const parsedChapters = computed(() => {
    if (chapterMode.value === 'single') return [{ index: 0, title: '全文', wordCount: totalWordCount.value }]
    return detectChapters(bookContent.value)
  })

  const readFile = async (file, encoding = null) => {
    const enc = encoding ?? selectedEncoding.value
    const content = await readFileContent(file, enc)
    bookContent.value = content
    return content
  }

  const setEncoding = (enc) => {
    selectedEncoding.value = enc
  }

  const setChapterMode = (mode) => {
    chapterMode.value = mode
  }

  const buildChapterList = () => {
    const mode = chapterMode.value
    const list = mode === 'regex' ? detectChapters(bookContent.value) : []
    return buildChapterListForNovel(bookContent.value, {
      mode,
      detectedChapters: list
    })
  }

  const reset = () => {
    bookContent.value = ''
    uploadedFile.value = null
    selectedEncoding.value = 'utf-8'
    chapterMode.value = 'regex'
  }

  return {
    bookContent,
    uploadedFile,
    selectedEncoding,
    chapterMode,
    totalWordCount,
    parsedChapters,
    readFile,
    setEncoding,
    setChapterMode,
    buildChapterList,
    reset,
    detectChapters
  }
}
