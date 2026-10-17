/**
 * Brain AI - RAG (Retrieval-Augmented Generation) API Service
 */

/**
 * Queries a PDF file via the RAG API.
 *
 * @param file - The PDF file to process
 * @param query - The user query/question regarding the PDF
 * @returns The generated answer from the RAG service
 */
export async function askAboutPdf(file: File, query: string): Promise<string> {
  const formData = new FormData()

  formData.append('file', file)
  formData.append('query', query)

  const response = await fetch('/api/rag/query', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to process PDF')
  }

  return data.answer
}

export const ragService = {
  askAboutPdf,
}

export default ragService
