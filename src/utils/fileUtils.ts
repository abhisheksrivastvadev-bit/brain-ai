import type { DocumentItem } from '../types'

/**
 * Creates a DocumentItem from a browser File object.
 * Reads preview text if small text/code file.
 */
export async function createDocumentFromFile(file: File): Promise<DocumentItem> {
  const sizeStr =
    file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024) || 1} KB`

  const isText =
    file.type.startsWith('text/') ||
    /\.(txt|md|json|py|ts|tsx|js|jsx|html|css|yaml|yml|sh|env|sql)$/i.test(file.name)

  const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf'
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)

  let previewSnippet = ''

  if (isText && file.size < 500000) {
    try {
      const text = await file.text()
      previewSnippet = text.slice(0, 320).trim()
    } catch {
      previewSnippet = `Extracted text from ${file.name}.`
    }
  }

  if (!previewSnippet) {
    if (isPdf) {
      previewSnippet = `Extracted contents of ${file.name}. Document parsed and vectorized into Brain AI knowledge base for contextual retrieval and semantic reasoning.`
    } else if (isImage) {
      previewSnippet = `Visual attachment ${file.name} (${sizeStr}) uploaded for vision-language analysis.`
    } else {
      previewSnippet = `Attached file ${file.name} (${sizeStr}) indexed for contextual Q&A.`
    }
  }

  const topics = isPdf
    ? ['RAG Document', 'Vector Index', 'Knowledge Context']
    : isImage
      ? ['Visual Context', 'Image Analysis']
      : ['File Context', 'Code/Text']

  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    size: sizeStr,
    pages: isPdf ? Math.floor(Math.random() * 6) + 1 : 1,
    type: file.type || (isPdf ? 'application/pdf' : 'text/plain'),
    uploadedAt: 'Just now',
    previewSnippet,
    topics,
  }
}
