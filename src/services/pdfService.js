import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

function extractPageText(content) {
  const textItems = content.items
    .filter((item) => item.str?.trim())
    .map((item) => ({
      text: item.str.trim(),
      x: item.transform[4],
      y: item.transform[5],
    }))
    .sort((first, second) => {
      if (Math.abs(second.y - first.y) > 3) return second.y - first.y
      return first.x - second.x
    })

  const lines = []

  textItems.forEach((item) => {
    const lastLine = lines[lines.length - 1]

    if (!lastLine || Math.abs(lastLine.y - item.y) > 3) {
      lines.push({ y: item.y, text: item.text })
      return
    }

    lastLine.text = `${lastLine.text} ${item.text}`
  })

  return lines.map((line) => line.text).join('\n')
}

export async function extractPdfText(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    pages.push(extractPageText(content))
  }

  return pages.join('\n\n').trim()
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }

    reader.onerror = () => reject(new Error('Could not read PDF for AI processing.'))
    reader.readAsDataURL(file)
  })
}
